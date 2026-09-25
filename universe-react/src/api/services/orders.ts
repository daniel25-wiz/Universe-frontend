/**
 * Orders API contract + factory.
 *
 * The marketplace transaction flow is: login -> products -> cart (client
 * state) -> checkout -> Paystack initialization (PaymentsApi) -> payment
 * verification (PaymentsApi) -> order creation (this API) -> delivery/address
 * information (part of CreateOrderRequest) -> order retrieval -> order
 * status. See docs/API_CONTRACT.md -> Orders.
 *
 * Both implementations satisfy this interface; which one is active depends
 * ONLY on VITE_API_MODE.
 */
import type { CreateOrderRequest, Order, OrderQueryParams, PaginatedResponse } from '../types';
import { apiConfig } from '../config';
import { MockOrdersApi } from '../mock/orders.mock';
import { RealOrdersApi } from '../real/orders.api';

export interface OrdersApi {
  /** List the authenticated buyer's orders (newest first). */
  getOrders(params?: OrderQueryParams): Promise<PaginatedResponse<Order>>;
  /**
   * List every order that contains at least one product owned by the
   * signed-in SELLER (newest first). `since`/`until` bound the window
   * server-side. Sales Analytics computes its figures from this endpoint —
   * every number shown is derived from these real orders, never hardcoded.
   */
  getSellerOrders(params?: OrderQueryParams): Promise<PaginatedResponse<Order>>;
  /** Retrieve one order by id (404 when it does not exist / is not yours). */
  getOrder(id: string): Promise<Order>;
  /**
   * Create an order. The backend validates the payment reference, recomputes
   * totals from its own catalog prices, and assigns the initial order status.
   * The frontend never reports an order as created unless the backend said so.
   */
  createOrder(data: CreateOrderRequest): Promise<Order>;
}

export const ordersApi: OrdersApi = apiConfig.mode === 'real' ? new RealOrdersApi() : new MockOrdersApi();
