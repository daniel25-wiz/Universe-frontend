import uuid

from django.conf import settings
from django.db import models


class Product(models.Model):
    CATEGORIES = [("tech", "Tech & Gadgets"), ("campus", "Campus Essentials"), ("lifestyle", "Lifestyle & Accessories")]
    STATUSES = [("draft", "Draft"), ("active", "Active"), ("archived", "Archived")]
    BADGES = [("flash", "Flash"), ("bestseller", "Bestseller")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="products")
    name = models.CharField(max_length=180)
    description = models.TextField(blank=True, default="")
    category = models.CharField(max_length=20, choices=CATEGORIES, default="lifestyle")
    price = models.DecimalField(max_digits=12, decimal_places=2)
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    images = models.JSONField(default=list, blank=True)   # list[str] URLs, first = cover
    variants = models.JSONField(default=list, blank=True)  # [{name, values: []}]
    status = models.CharField(max_length=10, choices=STATUSES, default="active")
    featured = models.BooleanField(default=False)
    badge = models.CharField(max_length=12, choices=BADGES, null=True, blank=True)
    campus_pickup = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    review_count = models.PositiveIntegerField(default=0)
    sold_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["seller", "status"]),
            models.Index(fields=["category", "status"]),
        ]

    def __str__(self):
        return self.name

    @property
    def display_price(self):
        if self.sale_price is not None and self.sale_price < self.price:
            return self.sale_price
        return self.price
