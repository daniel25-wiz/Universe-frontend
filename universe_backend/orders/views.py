import uuid

from django.db import transaction
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.exceptions import ApiError
from core.pagination import ItemsPagination
from core.permissions import IsSeller
from payments.models import PaymentTransaction
from products.models import Product

from .models import Order, OrderItem
from .serializers import CreateOrderSerializer, OrderSerializer


class OrderListCreateView(APIView):
    def get(self, request):
        qs = Order.objects.filter(buyer=request.user).prefetch_related("items")
        page = ItemsPagination()
        page_qs = page.paginate_queryset(qs, request)
        return page.get_paginated_response(OrderSerializer(page_qs, many=True).data)

    def post(self, request):
        ser = CreateOrderSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        payment_reference = data.get("payment_reference")

        with transaction.atomic():
            product_ids = [i["product_id"] for i in data["items"]]
            products = {
                p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids, status="active")
            }
            missing = set(product_ids) - set(products)
            if missing:
                raise ApiError("One or more items are no longer available.", code="PRODUCT_UNAVAILABLE", status_code=422)

            total = 0
            rows = []
            for line in data["items"]:
                product = products[line["product_id"]]
                qty = line["quantity"]
                if product.stock < qty:
                    raise ApiError(
                        f'Only {product.stock} left of "{product.name}".',
                        code="INSUFFICIENT_STOCK", status_code=422,
                    )
                unit_price = product.display_price
                line_total = unit_price * qty
                total += line_total
                rows.append((product, qty, unit_price, line_total))

            payment_txn = None
            if payment_reference:
                payment_txn = PaymentTransaction.objects.select_for_update().filter(
                    reference=payment_reference
                ).first()
                if payment_txn is None or payment_txn.status != "success":
                    raise ApiError(
                        "We couldn't verify that payment. Please try again.",
                        code="PAYMENT_NOT_VERIFIED", status_code=422,
                    )
                if payment_txn.order_id is not None:
                    raise ApiError(
                        "This payment has already been used for another order.",
                        code="PAYMENT_ALREADY_USED", status_code=422,
                    )
                if int(payment_txn.amount) != int(total):
                    raise ApiError(
                        "The amount paid does not match the order total.",
                        code="PAYMENT_AMOUNT_MISMATCH", status_code=422,
                    )

            buyer = request.user
            order = Order.objects.create(
                id=uuid.uuid4(), buyer=buyer, reference=f"UNI-{uuid.uuid4().hex[:10].upper()}",
                buyer_name=buyer.full_name, buyer_initials=(buyer.full_name[:1] or "?").upper(),
                delivery_address=data.get("delivery_address", ""), delivery_phone=data.get("delivery_phone", ""),
                amount=total, status="paid" if payment_txn else "pending",
                payment_reference=payment_reference,
            )
            for product, qty, unit_price, line_total in rows:
                OrderItem.objects.create(
                    id=uuid.uuid4(), order=order, product=product, seller_id=product.seller_id,
                    product_name=product.name, quantity=qty, unit_price=unit_price, line_total=line_total,
                )
                product.stock -= qty
                product.sold_count += qty
                product.save(update_fields=["stock", "sold_count"])

            if payment_txn:
                payment_txn.order = order
                payment_txn.save(update_fields=["order"])

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(RetrieveAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user).prefetch_related("items")


class SellerOrdersView(APIView):
    permission_classes = [IsSeller]

    def get(self, request):
        """Orders that include at least one item sold by this seller."""
        order_ids = OrderItem.objects.filter(seller=request.user).values_list("order_id", flat=True).distinct()
        qs = Order.objects.filter(id__in=order_ids).prefetch_related("items")
        page = ItemsPagination()
        page_qs = page.paginate_queryset(qs, request)
        return page.get_paginated_response(OrderSerializer(page_qs, many=True).data)
