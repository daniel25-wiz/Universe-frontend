/**
 * Real Payments API — implements the PaymentsApi contract (Paystack flows are
 * proxied through the backend; the frontend never holds Paystack keys).
 *
 * SUCCESS RULE: `verifyPayment()` reports exactly what the backend reports.
 * "success" means the backend said success — never that a redirect happened
 * or that a reference exists.
 */
import type {
  PaymentInitializationRequest,
  PaymentInitializationResponse,
  PaymentVerificationResponse,
} from '../types';
import type { PaymentsApi } from '../services/payments';
import { ApiError } from '../errors';
import { httpClient } from './client';
import { isRecord, toNumber, toText } from '../normalize';

export class RealPaymentsApi implements PaymentsApi {
  async initializePayment(
    data: PaymentInitializationRequest,
  ): Promise<PaymentInitializationResponse> {
    const raw = await httpClient.post<unknown>('/payments/initialize', data);
    const body = isRecord(raw) ? raw : {};
    const authorizationUrl = toText(body.authorizationUrl)
      ?? toText(body.authorization_url)
      ?? toText(body.checkoutUrl);
    const reference = toText(body.reference) ?? toText(body.transactionReference);
    const statusText = toText(body.status);
    const status: PaymentInitializationResponse['status'] =
      statusText === 'success' ? 'success'
      : statusText === 'failed' ? 'failed'
      : (() => {
        throw new ApiError({
          message: 'The payment server returned an unknown initialization status.',
          status: 0,
          code: 'UNKNOWN_ERROR',
        });
      })();
    if (!authorizationUrl || !reference) {
      // A 2xx without a checkout URL/reference cannot start a payment —
      // surface it instead of redirecting the buyer into the void.
      throw new ApiError({
        message: 'The payment could not be initialized. Please try again.',
        status: 0,
        code: 'UNKNOWN_ERROR',
      });
    }
    return { authorizationUrl, reference, status };
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResponse> {
    const raw = await httpClient.get<unknown>(
      `/payments/verify/${encodeURIComponent(reference)}`,
    );
    const body = isRecord(raw) ? raw : {};
    const statusText = toText(body.status) ?? toText(body.state);
    // Only the backend's explicit words map to a state; anything else is
    // "pending" — the honest "we do not know yet" answer.
    const status: PaymentVerificationResponse['status'] =
      statusText === 'success' ? 'success'
      : statusText === 'failed' ? 'failed'
      : 'pending';
    return {
      reference: toText(body.reference) ?? reference,
      status,
      amount: toNumber(body.amount),
      currency: toText(body.currency),
      transactionId: toText(body.transactionId) ?? toText(body.transaction_id),
      paidAt: toText(body.paidAt) ?? toText(body.paid_at),
      orderId: toText(body.orderId) ?? toText(body.order_id),
    };
  }
}
