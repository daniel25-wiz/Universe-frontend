from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    seller_id = serializers.UUIDField(source="seller_id", read_only=True)
    seller_name = serializers.CharField(source="seller.full_name", read_only=True)
    image = serializers.SerializerMethodField()
    old_price = serializers.SerializerMethodField()
    images = serializers.ListField(child=serializers.CharField(), required=False, max_length=12)
    variants = serializers.ListField(child=serializers.DictField(), required=False, max_length=10)

    class Meta:
        model = Product
        fields = [
            "id", "seller_id", "seller_name", "name", "description", "category",
            "price", "sale_price", "old_price", "stock", "image", "images", "variants",
            "status", "featured", "badge", "campus_pickup", "rating", "review_count",
            "sold_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "seller_id", "seller_name", "rating", "review_count", "sold_count", "created_at", "updated_at"]

    def get_image(self, obj):
        return obj.images[0] if obj.images else None

    def get_old_price(self, obj):
        if obj.sale_price is not None and obj.sale_price < obj.price:
            return obj.price
        return None

    def validate_sale_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Sale price can't be negative.")
        return value

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate(self, attrs):
        price = attrs.get("price", getattr(self.instance, "price", None))
        sale = attrs.get("sale_price", getattr(self.instance, "sale_price", None))
        if sale is not None and price is not None and sale >= price:
            raise serializers.ValidationError({"sale_price": "Sale price must be lower than the regular price."})
        return attrs
