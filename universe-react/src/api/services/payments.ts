/**
 * Payments API contract + factory (Paystack via the backend).
 *
 * The frontend NEVER talks to Paystack directly and NEVER decides that a
 * payment succeeded: it asks the backend to initialize a transaction,
 * redirects the buyer to the returned authorization URL, and then asks the
 * backend to VERIFY the transaction. Only `status: "success"` from
 * `verifyPayment()` may be shown to the buyer as a completed payment.
 */
import type {
  PaymentInitializationRequest,
  PaymentInitializationResponse,
  PaymentVerificationResponse,
} from '../types';
import { apiConfig } from '../config';
import { MockPaymentsApi } from '../mock/payments.mock';
import { RealPaymentsApi } from '../real/payments.api';

export interface PaymentsApi {
  /** Initialize a Paystack transaction; returns the checkout URL + reference. */
  initializePayment(data: PaymentInitializationRequest): Promise<PaymentInitializationResponse>;
  /** Ask the backend for the authoritative state of a transaction. */
  verifyPayment(reference: string): Promise<PaymentVerificationResponse>;
}

export const paymentsApi: PaymentsApi =
  apiConfig.mode === 'real' ? new RealPaymentsApi() : new MockPaymentsApi();
