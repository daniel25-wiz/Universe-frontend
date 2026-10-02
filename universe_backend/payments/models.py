import uuid

from django.conf import settings
from django.db import models


class PaymentTransaction(models.Model):
    STATUSES = [("pending", "Pending"), ("success", "Success"), ("failed", "Failed")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=100, unique=True)
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payment_transactions")
    order = models.OneToOneField("orders.Order", on_delete=models.SET_NULL, null=True, blank=True, related_name="payment_transaction")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUSES, default="pending")
    raw_verify_response = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
