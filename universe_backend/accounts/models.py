import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils.text import slugify


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email is required")
        user = self.model(email=email.strip().lower(), **extra)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    ACCOUNT_TYPES = [("buyer", "Buyer"), ("seller", "Seller")]
    PROVIDERS = [("password", "Password"), ("google", "Google")]
    STATUSES = [("active", "Active"), ("suspended", "Suspended")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    account_type = models.CharField(max_length=10, choices=ACCOUNT_TYPES, default="buyer")
    auth_provider = models.CharField(max_length=10, choices=PROVIDERS, default="password")
    google_sub = models.CharField(max_length=64, unique=True, null=True, blank=True)
    avatar_url = models.TextField(null=True, blank=True)
    phone = models.CharField(max_length=30, blank=True, default="")
    status = models.CharField(max_length=10, choices=STATUSES, default="active")
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    def save(self, *args, **kwargs):
        self.email = self.email.strip().lower()
        self.is_active = self.status == "active"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


class SellerProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="seller_profile")
    slug = models.SlugField(max_length=80, unique=True, null=True, blank=True)
    store_name = models.CharField(max_length=120, blank=True, default="")
    phone = models.CharField(max_length=30, blank=True, default="")
    level = models.CharField(max_length=20, blank=True, default="")
    department = models.CharField(max_length=120, blank=True, default="")
    course = models.CharField(max_length=120, blank=True, default="")
    school = models.CharField(max_length=160, blank=True, default="")
    bio = models.TextField(blank=True, default="")
    logo_url = models.TextField(null=True, blank=True)
    banner_url = models.TextField(null=True, blank=True)
    banner_images = models.JSONField(default=list, blank=True)
    store_template = models.CharField(max_length=60, null=True, blank=True)
    pickup_location = models.CharField(max_length=160, null=True, blank=True)
    support_email = models.EmailField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def ensure_slug(self):
        base = slugify(self.store_name or self.user.full_name) or f"store-{str(self.id)[:8]}"
        base = base[:70]
        candidate, n = base, 1
        while SellerProfile.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
            n += 1
            candidate = f"{base}-{n}"
        self.slug = candidate

    def __str__(self):
        return self.store_name or self.user.email


class PasswordResetCode(models.Model):
    email = models.EmailField(db_index=True)
    code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    used = models.BooleanField(default=False)
