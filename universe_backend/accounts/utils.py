from datetime import timedelta

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from core.exceptions import ApiError

from .models import SellerProfile


def tokens_for(user, remember=True):
    refresh = RefreshToken.for_user(user)
    if not remember:
        refresh.set_exp(lifetime=timedelta(days=1))
    return {
        "access_token": str(refresh.access_token),
        "refresh_token": str(refresh),
        "expires_in": int(refresh.access_token.lifetime.total_seconds()),
    }


def check_password_strength(password, user=None, field="password"):
    try:
        validate_password(password, user=user)
    except DjangoValidationError as exc:
        message = " ".join(exc.messages)
        raise ApiError(message, code="WEAK_PASSWORD", status_code=400, field_errors={field: message})


def get_or_create_seller_profile(user):
    profile, created = SellerProfile.objects.get_or_create(user=user)
    if not profile.slug:
        profile.ensure_slug()
        profile.save(update_fields=["slug"])
    return profile
