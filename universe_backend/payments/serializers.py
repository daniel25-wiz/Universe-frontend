from rest_framework import serializers


class InitializePaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=1)
    email = serializers.EmailField(required=False)
