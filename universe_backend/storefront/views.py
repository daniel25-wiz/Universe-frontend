from collections import Counter

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import SellerProfile
from core.exceptions import ApiError
from products.serializers import ProductSerializer


class StorefrontView(APIView):
    """Public storefront page for a seller, keyed by their store slug."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, slug):
        profile = SellerProfile.objects.select_related("user").filter(
            slug=slug, user__status="active"
        ).first()
        if profile is None:
            raise ApiError("Store not found.", code="NOT_FOUND", status_code=404)

        seller = profile.user
        products = seller.products.filter(status="active").order_by("-created_at")
        serialized = ProductSerializer(products, many=True).data
        counts = Counter(p["category"] for p in serialized)

        return Response({
            "slug": profile.slug,
            "store_id": str(profile.id),
            "seller_id": str(seller.id),
            "name": profile.store_name or seller.full_name,
            "owner": seller.full_name,
            "school": profile.school,
            "phone": profile.phone,
            "email": profile.support_email,
            "bio_lead": profile.bio[:160] if profile.bio else None,
            "bio_detail": profile.bio,
            "banner_image": profile.banner_url,
            "banner_images": profile.banner_images or ([profile.banner_url] if profile.banner_url else []),
            "avatar_image": profile.logo_url,
            "template": profile.store_template,
            "pickup_location": profile.pickup_location,
            "member_since": seller.created_at.date().isoformat(),
            "catalog_counts": {
                "all": len(serialized),
                "tech": counts.get("tech", 0),
                "campus": counts.get("campus", 0),
                "lifestyle": counts.get("lifestyle", 0),
            },
            "products": serialized,
        })
