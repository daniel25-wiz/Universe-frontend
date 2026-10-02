from rest_framework import serializers

from .models import SellerProfile, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "full_name", "account_type", "auth_provider",
            "avatar_url", "phone", "status", "created_at", "updated_at",
        ]
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, max_length=128)
    account_type = serializers.ChoiceField(choices=["buyer", "seller"])


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(max_length=128)
    remember_me = serializers.BooleanField(required=False, default=True)


class GoogleLoginSerializer(serializers.Serializer):
    credential = serializers.CharField()
    remember_me = serializers.BooleanField(required=False, default=True)
    account_type = serializers.ChoiceField(choices=["buyer", "seller"], required=False, default="buyer")


class UpdateUserSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150, required=False)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    avatar_url = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=False, allow_blank=True)
    new_password = serializers.CharField(max_length=128)


class ChangeEmailSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=False, allow_blank=True)
    new_email = serializers.EmailField()


class DeleteAccountSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=False, allow_blank=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyResetCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=10)


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=10)
    new_password = serializers.CharField(max_length=128)


class SellerProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(read_only=True)
    banner_images = serializers.ListField(child=serializers.CharField(), required=False, allow_null=True, max_length=10)

    class Meta:
        model = SellerProfile
        fields = [
            "id", "user_id", "store_name", "phone", "level", "department", "course",
            "school", "bio", "logo_url", "banner_url", "banner_images",
            "store_template", "pickup_location", "support_email",
        ]
        read_only_fields = ["id", "user_id"]
        extra_kwargs = {f: {"required": False} for f in fields}

    def validate_banner_images(self, value):
        return value or []


class PublicSellerProfileSerializer(serializers.Serializer):
    """Only what the seller chose to publish (see PublicSellerProfile in types.ts)."""

    @staticmethod
    def to_public(profile):
        user = profile.user
        return {
            "user_id": str(user.id),
            "name": profile.store_name or user.full_name,
            "email": profile.support_email or None,
            "phone": profile.phone or None,
            "level": profile.level or None,
            "department": profile.department or None,
            "course": profile.course or None,
            "school": profile.school or None,
            "bio": profile.bio or None,
            "logo_url": profile.logo_url or None,
        }
