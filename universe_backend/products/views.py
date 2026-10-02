from django.conf import settings
from django.db.models import Q
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated

from core.exceptions import ApiError
from core.pagination import ItemsPagination
from core.permissions import IsSeller

from .models import Product
from .serializers import ProductSerializer


class ProductListCreateView(ListCreateAPIView):
    serializer_class = ProductSerializer
    pagination_class = ItemsPagination

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated(), IsSeller()]

    def get_queryset(self):
        qs = Product.objects.select_related("seller").all()
        params = self.request.query_params

        if self.request.method == "GET" and not params.get("seller_id"):
            qs = qs.filter(status="active")  # public browsing only sees active listings

        seller_id = params.get("seller_id")
        if seller_id:
            qs = qs.filter(seller_id=seller_id)

        status_param = params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        category = params.get("category")
        if category:
            qs = qs.filter(category=category)

        search = params.get("search")
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

        featured = params.get("featured")
        if featured is not None:
            qs = qs.filter(featured=featured.lower() in ("1", "true", "yes"))

        ordering = params.get("ordering")
        allowed = {"price", "-price", "created_at", "-created_at", "sold_count", "-sold_count"}
        if ordering in allowed:
            qs = qs.order_by(ordering)
        return qs

    def perform_create(self, serializer):
        seller = self.request.user
        active_count = Product.objects.filter(seller=seller, status="active").count()
        if active_count >= settings.WORKSHOP_PRODUCT_LIMIT:
            raise ApiError(
                f"You can list at most {settings.WORKSHOP_PRODUCT_LIMIT} products.",
                code="WORKSHOP_LIMIT_REACHED", status_code=422,
            )
        featured = serializer.validated_data.get("featured", False)
        if featured:
            featured_count = Product.objects.filter(seller=seller, featured=True, status="active").count()
            if featured_count >= settings.MARKETPLACE_LISTING_LIMIT:
                raise ApiError(
                    f"You can feature at most {settings.MARKETPLACE_LISTING_LIMIT} products on the marketplace.",
                    code="MARKETPLACE_LIMIT_REACHED", status_code=422,
                )
        serializer.save(seller=seller)


class ProductDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    queryset = Product.objects.select_related("seller").all()

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated(), IsSeller()]

    def get_object(self):
        obj = super().get_object()
        if self.request.method != "GET" and obj.seller_id != self.request.user.id:
            raise ApiError("You can only manage your own products.", code="FORBIDDEN", status_code=403)
        return obj

    def perform_update(self, serializer):
        instance = self.get_object()
        wants_featured = serializer.validated_data.get("featured", instance.featured)
        if wants_featured and not instance.featured:
            featured_count = Product.objects.filter(
                seller=instance.seller, featured=True, status="active"
            ).exclude(pk=instance.pk).count()
            if featured_count >= settings.MARKETPLACE_LISTING_LIMIT:
                raise ApiError(
                    f"You can feature at most {settings.MARKETPLACE_LISTING_LIMIT} products on the marketplace.",
                    code="MARKETPLACE_LIMIT_REACHED", status_code=422,
                )
        serializer.save()
