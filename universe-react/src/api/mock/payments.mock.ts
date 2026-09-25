/**
 * Mock Payments API — simulates the Paystack-via-backend flow for
 * development. The mock ALWAYS "succeeds" after its simulated latency: this
 * is deliberate development behavior and is the ONLY place a payment success
 * may be fabricated. The real adapter (real/payments.api.ts) reports success
 * exclusively from the backend's verification response.
 *
 * The verified amounts are tracked in-memory so the mock orders API can
 * enforce the same "pay first, then order" rule the contract demands.
 */
import type {
  PaymentInitializationRequest,
  PaymentInitializationResponse,
  PaymentVerificationResponse,
} from '../types';
import type { PaymentsApi } from '../services/payments';
import { withMockLatency } from './mockLatency';
import { ApiError } from '../errors';
import { logApi } from '../logger';

/** reference -> verified amount (major units). Simulated Paystack ledger. */
const verifiedPayments = new Map<string, number>();

/**
 * The amount the mock "Paystack" verified for a reference, or null when the
 * reference was never initialized/verified. Used by MockOrdersApi to refuse
 * orders that did not go through payment.
 */
export function verifiedPaymentAmount(reference: string): number | null {
  return verifiedPayments.get(reference) ?? null;
}

export class MockPaymentsApi implements PaymentsApi {
  async initializePayment(
    data: PaymentInitializationRequest,
  ): Promise<PaymentInitializationResponse> {
    logApi('POST', '/payments/initialize');
    return withMockLatency((async () => {
      const amount = Number(data.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new ApiError({
          message: 'Please correct the highlighted fields.',
          status: 422,
          code: 'VALIDATION_ERROR',
          fieldErrors: { amount: 'Amount must be a positive number' },
        });
      }
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new ApiError({
          message: 'Please correct the highlighted fields.',
          status: 422,
          code: 'VALIDATION_ERROR',
          fieldErrors: { email: 'Enter a valid email' },
        });
      }
      const reference = `PS-MOCK-${Date.now().toString(36).toUpperCase()}`;
      // Simulated ledger entry — the buyer "pays" instantly in mock mode.
      verifiedPayments.set(reference, Math.round(amount * 100) / 100);
      return {
        // A stand-in checkout URL: in real mode the backend returns the
        // actual Paystack authorization_url.
        authorizationUrl: `https://checkout.paystack.com/${reference.toLowerCase()}`,
        reference,
        status: 'success',
      };
    })());
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResponse> {
    logApi('GET', `/payments/verify/${reference}`);
    return withMockLatency((async () => {
      const amount = verifiedPayments.get(reference);
      if (amount === undefined) {
        // Unknown reference — reported as failed, the way an unverified
        // transaction must read to the order flow.
        return { reference, status: 'failed', amount: null, paidAt: null, orderId: null };
      }
      return {
        reference,
        status: 'success',
        amount,
        currency: 'NGN',
        transactionId: reference,
        paidAt: new Date().toISOString(),
        orderId: null,
      };
    })());
  }
}
