import hashlib
import hmac
import json
import uuid

from django.conf import settings
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.exceptions import ApiError

from . import paystack
from .models import PaymentTransaction
from .serializers import InitializePaymentSerializer


class InitializePaymentView(APIView):
    def post(self, request):
        ser = InitializePaymentSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        reference = f"UNIPAY-{uuid.uuid4().hex[:12].upper()}"
        email = data.get("email") or request.user.email

        result = paystack.initialize_transaction(
            email=email, amount_naira=data["amount"], reference=reference,
            callback_url=settings.PAYSTACK_CALLBACK_URL,
        )

        PaymentTransaction.objects.create(
            id=uuid.uuid4(), reference=result.get("reference", reference),
            buyer=request.user, amount=data["amount"], status="pending",
        )
        return Response({
            "authorization_url": result["authorization_url"],
            "reference": result.get("reference", reference),
            "status": "pending",
        })


class VerifyPaymentView(APIView):
    def get(self, request, reference):
        txn = PaymentTransaction.objects.filter(reference=reference, buyer=request.user).first()
        if txn is None:
            raise ApiError("Payment record not found.", code="NOT_FOUND", status_code=404)

        if txn.status != "success":
            result = paystack.verify_transaction(reference)
            paid_naira = (result.get("amount") or 0) / 100
            txn.raw_verify_response = result
            if result.get("status") == "success" and round(paid_naira, 2) == round(float(txn.amount), 2):
                txn.status = "success"
            elif result.get("status") in ("failed", "abandoned"):
                txn.status = "failed"
            txn.save(update_fields=["status", "raw_verify_response", "updated_at"])

        return Response({"reference": txn.reference, "status": txn.status, "amount": txn.amount})


@method_decorator(csrf_exempt, name="dispatch")
class PaystackWebhookView(APIView):
    """
    Server-to-server notification from Paystack. Configure this URL in your
    Paystack dashboard under Settings -> API Keys & Webhooks, e.g.
    https://yourdomain.com/api/payments/webhook

    Paystack signs the raw request body with your secret key (HMAC-SHA512) and
    sends it in the X-Paystack-Signature header -- we verify that before
    trusting anything in the payload.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        signature = request.headers.get("X-Paystack-Signature", "")
        expected = hmac.new(
            settings.PAYSTACK_SECRET_KEY.encode("utf-8"),
            request.body,
            hashlib.sha512,
        ).hexdigest()

        if not settings.PAYSTACK_SECRET_KEY or not hmac.compare_digest(expected, signature):
            # Don't leak why -- just refuse it.
            return HttpResponse(status=401)

        event = json.loads(request.body)
        if event.get("event") == "charge.success":
            data = event["data"]
            reference = data["reference"]
            paid_naira = (data.get("amount") or 0) / 100

            txn = PaymentTransaction.objects.filter(reference=reference).first()
            if txn and txn.status != "success":
                txn.raw_verify_response = data
                if round(paid_naira, 2) == round(float(txn.amount), 2):
                    txn.status = "success"
                else:
                    txn.status = "failed"  # amount mismatch -- don't trust it
                txn.save(update_fields=["status", "raw_verify_response", "updated_at"])

        # Always 200 once verified, even for events you don't act on,
        # so Paystack doesn't keep retrying.
        return HttpResponse(status=200)