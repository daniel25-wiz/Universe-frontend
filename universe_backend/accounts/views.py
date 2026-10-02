import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from core.exceptions import ApiError
from core.permissions import IsSeller

from .emails import send_reset_code
from .models import PasswordResetCode, SellerProfile, User
from .serializers import (
    ChangeEmailSerializer, ChangePasswordSerializer, DeleteAccountSerializer,
    ForgotPasswordSerializer, GoogleLoginSerializer, LoginSerializer,
    PublicSellerProfileSerializer, RegisterSerializer, ResetPasswordSerializer,
    SellerProfileSerializer, UpdateUserSerializer, UserSerializer,
    VerifyResetCodeSerializer,
)
from .utils import check_password_strength, get_or_create_seller_profile, tokens_for


class ThrottledAuthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "auth"


def revoke_all_sessions(user):
    """Blacklist every refresh token the user holds."""
    from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)


# ------------------------------------------------------------------ auth
class RegisterView(ThrottledAuthView):
    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        email = data["email"].strip().lower()

        if User.objects.filter(email__iexact=email).exists():
            raise ApiError(
                "An account with this email already exists.",
                code="EMAIL_TAKEN", status_code=409,
                field_errors={"email": "An account with this email already exists."},
            )
        check_password_strength(data["password"], user=User(email=email, full_name=data["full_name"]))

        with transaction.atomic():
            user = User.objects.create_user(
                email=email, password=data["password"],
                full_name=data["full_name"].strip(), account_type=data["account_type"],
            )
            if user.account_type == "seller":
                get_or_create_seller_profile(user)

        return Response(
            {"user": UserSerializer(user).data, "tokens": tokens_for(user), "is_new_user": True},
            status=status.HTTP_201_CREATED,
        )


class LoginView(ThrottledAuthView):
    def post(self, request):
        ser = LoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        user = User.objects.filter(email__iexact=data["email"].strip()).first()

        bad = ApiError("Incorrect email or password.", code="INVALID_CREDENTIALS", status_code=401)
        if user is None or not user.has_usable_password() or not user.check_password(data["password"]):
            raise bad
        if user.status != "active":
            raise ApiError("This account has been suspended.", code="FORBIDDEN", status_code=403)

        return Response({"user": UserSerializer(user).data, "tokens": tokens_for(user, data["remember_me"])})


class GoogleLoginView(ThrottledAuthView):
    def post(self, request):
        ser = GoogleLoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        if not settings.GOOGLE_CLIENT_ID:
            raise ApiError("Google sign-in is not configured on the server.", code="SERVER_ERROR", status_code=503)

        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        try:
            claims = id_token.verify_oauth2_token(
                data["credential"], google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except ValueError:
            raise ApiError("Google sign-in failed. Please try again.", code="INVALID_CREDENTIALS", status_code=401)

        email = (claims.get("email") or "").lower()
        if not email or not claims.get("email_verified"):
            raise ApiError("Your Google email is not verified.", code="INVALID_CREDENTIALS", status_code=401)

        created = False
        with transaction.atomic():
            user = User.objects.filter(google_sub=claims["sub"]).first() or User.objects.filter(email__iexact=email).first()
            if user is None:
                user = User.objects.create_user(
                    email=email, password=None,
                    full_name=claims.get("name") or email.split("@")[0],
                    account_type=data["account_type"], auth_provider="google",
                    google_sub=claims["sub"], avatar_url=claims.get("picture"),
                )
                created = True
                if user.account_type == "seller":
                    get_or_create_seller_profile(user)
            elif not user.google_sub:
                user.google_sub = claims["sub"]
                if not user.avatar_url and claims.get("picture"):
                    user.avatar_url = claims["picture"]
                user.save()

        if user.status != "active":
            raise ApiError("This account has been suspended.", code="FORBIDDEN", status_code=403)

        return Response(
            {"user": UserSerializer(user).data, "tokens": tokens_for(user, data["remember_me"]), "is_new_user": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class RefreshView(ThrottledAuthView):
    def post(self, request):
        token = request.data.get("refresh") or request.data.get("refresh_token") or request.data.get("refreshToken")
        if not token:
            raise ApiError("Refresh token is required.", code="UNAUTHORIZED", status_code=401)
        ser = TokenRefreshSerializer(data={"refresh": token})
        try:
            ser.is_valid(raise_exception=True)
        except (TokenError, ValidationError, AuthenticationFailed):
            raise ApiError("Session expired. Please sign in again.", code="UNAUTHORIZED", status_code=401)
        out = ser.validated_data
        return Response({"access_token": out["access"], "refresh_token": out.get("refresh", token)})


class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.data.get("refresh") or request.data.get("refresh_token")
        if token:
            try:
                RefreshToken(token).blacklist()
            except TokenError:
                pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ------------------------------------------------------- password reset
def _latest_code(email):
    return (
        PasswordResetCode.objects.filter(email__iexact=email, used=False)
        .order_by("-created_at").first()
    )


def _check_code(email, code):
    record = _latest_code(email)
    invalid = ApiError(
        "That code is invalid or has expired.", code="VALIDATION_ERROR", status_code=400,
        field_errors={"code": "That code is invalid or has expired."},
    )
    if record is None or record.expires_at < timezone.now():
        raise invalid
    if record.attempts >= settings.PASSWORD_RESET_MAX_ATTEMPTS:
        raise ApiError("Too many attempts. Request a new code.", code="RATE_LIMITED", status_code=429)
    if not check_password(code.strip(), record.code_hash):
        record.attempts += 1
        record.save(update_fields=["attempts"])
        raise invalid
    return record


class ForgotPasswordView(ThrottledAuthView):
    throttle_scope = "otp"

    def post(self, request):
        ser = ForgotPasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"].strip().lower()
        body = {"message": "If an account exists with this email, a verification code has been sent."}

        user = User.objects.filter(email__iexact=email, status="active").first()
        if user:
            code = f"{secrets.randbelow(10**6):06d}"
            PasswordResetCode.objects.filter(email__iexact=email).delete()
            PasswordResetCode.objects.create(
                email=email, code_hash=make_password(code),
                expires_at=timezone.now() + timedelta(minutes=settings.PASSWORD_RESET_CODE_TTL_MINUTES),
            )
            try:
                send_reset_code(email, code)
            except Exception:  # never reveal delivery problems (or account existence)
                pass
            if settings.DEBUG:
                body["dev_otp"] = code  # development only
        return Response(body)


class VerifyResetCodeView(ThrottledAuthView):
    throttle_scope = "otp"

    def post(self, request):
        ser = VerifyResetCodeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        _check_code(ser.validated_data["email"], ser.validated_data["code"])
        return Response({"message": "Verification code confirmed.", "verified": True})


class ResetPasswordView(ThrottledAuthView):
    throttle_scope = "otp"

    def post(self, request):
        ser = ResetPasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        record = _check_code(data["email"], data["code"])
        user = User.objects.filter(email__iexact=data["email"], status="active").first()
        if user is None:
            raise ApiError("That code is invalid or has expired.", code="VALIDATION_ERROR", status_code=400)
        check_password_strength(data["new_password"], user=user, field="new_password")

        with transaction.atomic():
            user.set_password(data["new_password"])
            user.save()
            record.used = True
            record.save(update_fields=["used"])
            revoke_all_sessions(user)
        return Response({"message": "Password reset successfully. You can now log in with your new password."})


# ------------------------------------------------------------------ users
def _require_current_password(user, supplied):
    """Users with a password must confirm it; Google-only accounts have none."""
    if user.has_usable_password() and not user.check_password(supplied or ""):
        raise ApiError(
            "Your current password is incorrect.", code="INVALID_CURRENT_PASSWORD", status_code=400,
            field_errors={"current_password": "Your current password is incorrect."},
        )


class UserMeView(APIView):
    def patch(self, request):
        ser = UpdateUserSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user
        for field, value in ser.validated_data.items():
            setattr(user, field, value.strip() if isinstance(value, str) and field != "avatar_url" else value)
        user.save()
        return Response(UserSerializer(user).data)

    def delete(self, request):
        ser = DeleteAccountSerializer(data=request.data or {})
        ser.is_valid(raise_exception=True)
        _require_current_password(request.user, ser.validated_data.get("current_password"))
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChangePasswordView(APIView):
    def patch(self, request):
        ser = ChangePasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user
        _require_current_password(user, ser.validated_data.get("current_password"))
        check_password_strength(ser.validated_data["new_password"], user=user, field="new_password")
        user.set_password(ser.validated_data["new_password"])
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChangeEmailView(APIView):
    def post(self, request):
        ser = ChangeEmailSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user
        _require_current_password(user, ser.validated_data.get("current_password"))
        new_email = ser.validated_data["new_email"].strip().lower()
        if User.objects.filter(email__iexact=new_email).exclude(pk=user.pk).exists():
            raise ApiError(
                "That email is already in use.", code="EMAIL_TAKEN", status_code=409,
                field_errors={"new_email": "That email is already in use."},
            )
        user.email = new_email
        user.save()
        return Response(UserSerializer(user).data)


class MySellerProfileView(APIView):
    permission_classes = [IsAuthenticated, IsSeller]

    def get(self, request):
        return Response(SellerProfileSerializer(get_or_create_seller_profile(request.user)).data)

    def patch(self, request):
        profile = get_or_create_seller_profile(request.user)
        ser = SellerProfileSerializer(profile, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        name_before = profile.store_name
        profile = ser.save()
        if profile.store_name and profile.store_name != name_before:
            profile.ensure_slug()
            profile.save(update_fields=["slug"])
        return Response(SellerProfileSerializer(profile).data)


class PublicSellerProfileView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, user_id):
        profile = (
            SellerProfile.objects.select_related("user")
            .filter(user_id=user_id, user__status="active").first()
        )
        if profile is None:
            raise ApiError("Seller not found.", code="NOT_FOUND", status_code=404)
        return Response(PublicSellerProfileSerializer.to_public(profile))
