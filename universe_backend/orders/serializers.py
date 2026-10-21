from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "product_id", "seller_id", "product_name", "quantity", "unit_price", "line_total"]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "reference", "buyer_name", "buyer_initials", "delivery_address",
            "delivery_phone", "amount", "status", "payment_reference", "items",
            "created_at", "updated_at",
        ]
        read_only_fields = fields


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, max_value=999)


class CreateOrderSerializer(serializers.Serializer):
    items = OrderItemInputSerializer(many=True, allow_empty=False)
    delivery_address = serializers.CharField(required=False, allow_blank=True, default="")
    delivery_phone = serializers.CharField(required=False, allow_blank=True, default="")
    payment_reference = serializers.CharField(required=False, allow_null=True)