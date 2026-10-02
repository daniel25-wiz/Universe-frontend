"""Thin wrapper around the Paystack REST API. Docs: https://paystack.com/docs/api/transaction/"""
import requests
from django.conf import settings

from core.exceptions import ApiError

BASE_URL = "https://api.paystack.co"


def _headers():
    if not settings.PAYSTACK_SECRET_KEY:
        raise ApiError("Payments are not configured on the server.", code="SERVER_ERROR", status_code=503)
    return {"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}", "Content-Type": "application/json"}


def initialize_transaction(email, amount_naira, reference, callback_url):
    try:
        resp = requests.post(
            f"{BASE_URL}/transaction/initialize",
            json={
                "email": email,
                "amount": int(round(amount_naira * 100)),  # kobo
                "reference": reference,
                "callback_url": callback_url,
            },
            headers=_headers(), timeout=15,
        )
    except requests.RequestException:
        raise ApiError("Could not reach the payment provider. Please try again.", code="SERVER_ERROR", status_code=502)

    body = resp.json()
    if not resp.ok or not body.get("status"):
        raise ApiError(body.get("message", "Could not start payment."), code="PAYMENT_INIT_FAILED", status_code=502)
    return body["data"]  # { authorization_url, access_code, reference }


def verify_transaction(reference):
    try:
        resp = requests.get(f"{BASE_URL}/transaction/verify/{reference}", headers=_headers(), timeout=15)
    except requests.RequestException:
        raise ApiError("Could not reach the payment provider. Please try again.", code="SERVER_ERROR", status_code=502)

    body = resp.json()
    if not resp.ok or not body.get("status"):
        raise ApiError(body.get("message", "Could not verify payment."), code="PAYMENT_VERIFY_FAILED", status_code=502)
    return body["data"]  # { status: 'success'|'failed'|..., amount (kobo), reference, ... }
