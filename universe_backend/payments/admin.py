from django.contrib import admin

from .models import PaymentTransaction


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ("reference", "buyer", "amount", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("reference", "buyer__email")
