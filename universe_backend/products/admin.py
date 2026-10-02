from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "seller", "category", "price", "stock", "status", "featured")
    list_filter = ("category", "status", "featured")
    search_fields = ("name", "seller__email")
