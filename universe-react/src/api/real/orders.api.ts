/**
 * Real Orders API — implements the OrdersApi contract against the real
 * backend (docs/API_CONTRACT.md -> Orders).
 *
 * The adapter ONLY relays what the backend reports: an order exists when the
 * backend created it, its status is whatever the backend returns, and its
 * amount is whatever the backend computed. Nothing is simulated locally.
 */
import type { CreateOrderRequest, Order, OrderItem, OrderQueryParams, PaginatedResponse } from '../types';
import type { OrdersApi } from '../services/orders';
import { ApiError } from '../errors';
import { httpClient } from './client';
import { isRecord, toNumber, toText, unwrapEnvelope } from '../normalize';

/** Envelopes a backend may wrap an order payload in. */
const ORDER_ENVELOPE = ['order', 'data', 'result'];

const VALID_ORDER_STATUSES = ['pending', 'paid', 'fulfilled', 'cancelled'];

/**
 * Normalize one order line item. Malformed entries (no productId) are dropped
 * rather than guessed — analytics must never count a line the backend did not
 * actually report.
 */
export function normalizeOrderItem(raw: unknown): OrderItem | null {
  const record = isRecord(raw) ? raw : {};
  const productId = toText(record.productId) ?? toText(record.product) ?? null;
  if (!productId) return null;
  const quantity = Math.max(1, Math.round(toNumber(record.quantity) ?? 1));
  const unitPrice = toNumber(record.unitPrice) ?? toNumber(record.price);
  const lineTotal = toNumber(record.lineTotal) ?? toNumber(record.total);
  return {
    productId,
    productName: toText(record.productName) ?? toText(record.name) ?? '',
    quantity,
    unitPrice,
    // Fall back to the documented arithmetic only when the backend omitted
    // lineTotal but did send a unit price — never a fabricated amount.
    lineTotal: lineTotal ?? (unitPrice != null ? unitPrice * quantity : null),
    sellerId: toText(record.sellerId) ?? null,
  };
}

/**
 * Normalize one order payload into the UI's `Order` shape.
 *
 * `status` is the backend's word only: an unrecognized status throws instead
 * of being silently mapped to a plausible one.
 */
export function normalizeOrder(raw: unknown): Order {
  const record = isRecord(raw) ? raw : {};
  const status = toText(record.status) ?? toText(record.state);
  if (!status || !VALID_ORDER_STATUSES.includes(status)) {
    throw new ApiError({
      message: 'The server returned an order with an unknown status.',
      status: 0,
      code: 'UNKNOWN_ERROR',
    });
  }
  const createdAt = toText(record.createdAt) ?? toText(record.created) ?? '';
  // Line items: REQUIRED on /seller/orders (analytics depends on them),
  // optional elsewhere. When absent the field stays undefined and the UI
  // falls back to the order total — nothing is invented here.
  const items = Array.isArray(record.items)
    ? record.items
        .map((entry) => normalizeOrderItem(entry))
        .filter((entry): entry is OrderItem => entry !== null)
    : undefined;
  return {
    id: toText(record.id) ?? toText(record.uuid) ?? '',
    reference: toText(record.reference) ?? toText(record.orderReference) ?? '',
    buyerName: toText(record.buyerName) ?? toText(record.customerName) ?? '',
    buyerInitials: toText(record.buyerInitials) ?? undefined,
    amount: toNumber(record.amount) ?? toNumber(record.total),
    status: status as Order['status'],
    createdAt,
    ...(items ? { items } : {}),
  };
}

/** Query string shared by both order-list endpoints. */
function buildOrderQuery(page: number, pageSize: number, params: OrderQueryParams): string {
  const sp = new URLSearchParams();
  sp.set('page', String(page));
  sp.set('page_size', String(pageSize));
  // Optional ISO window — server-side period filtering (docs/API_CONTRACT.md).
  if (params.since) sp.set('since', params.since);
  if (params.until) sp.set('until', params.until);
  return sp.toString();
}

/**
 * Parse either documented list envelope. Accepts a bare array, `{ items }`,
 * `{ results }` (DRF), `{ data }` or `{ orders }`.
 */
function toOrderPage(raw: unknown, page: number, pageSize: number): PaginatedResponse<Order> {
  const items: unknown[] = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.items) ? raw.items
    : isRecord(raw) && Array.isArray(raw.results) ? raw.results
    : isRecord(raw) && Array.isArray(raw.data) ? raw.data
    : isRecord(raw) && Array.isArray(raw.orders) ? raw.orders
    : [];
  const record = isRecord(raw) ? raw : {};
  const total = toNumber(record.total) ?? toNumber(record.count) ?? items.length;
  return {
    items: items.map((entry) => normalizeOrder(entry)),
    page,
    pageSize,
    total: Math.max(total, items.length),
  };
}

export class RealOrdersApi implements OrdersApi {
  async getOrders(params: OrderQueryParams = {}): Promise<PaginatedResponse<Order>> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.max(1, params.pageSize ?? 20);
    const raw = await httpClient.get<unknown>(`/orders?${buildOrderQuery(page, pageSize, params)}`);
    return toOrderPage(raw, page, pageSize);
  }

  /**
   * Orders visible to the signed-in SELLER — every order containing at least
   * one line of a product they own, newest first, WITH line items. Sales
   * Analytics derives every figure from this endpoint; the adapter relays
   * exactly what the backend computed and invents nothing
   * (docs/API_CONTRACT.md -> Orders).
   */
  async getSellerOrders(params: OrderQueryParams = {}): Promise<PaginatedResponse<Order>> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.max(1, params.pageSize ?? 20);
    const raw = await httpClient.get<unknown>(`/seller/orders?${buildOrderQuery(page, pageSize, params)}`);
    return toOrderPage(raw, page, pageSize);
  }

  async getOrder(id: string): Promise<Order> {
    const raw = await httpClient.get<unknown>(`/orders/${encodeURIComponent(id)}`);
    const order = normalizeOrder(unwrapEnvelope(raw, ORDER_ENVELOPE));
    if (!order.id) {
      throw new ApiError({
        message: 'The server returned an unexpected order response.',
        status: 0,
        code: 'UNKNOWN_ERROR',
      });
    }
    return order;
  }

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const raw = await httpClient.post<unknown>('/orders', data);
    const order = normalizeOrder(unwrapEnvelope(isRecord(raw) ? raw : {}, ORDER_ENVELOPE));
    if (!order.id) {
      // The backend MUST return the created order. The frontend never
      // pretends an order was created without the backend saying so.
      throw new ApiError({
        message: 'The server did not confirm the order. Check your order history before retrying.',
        status: 0,
        code: 'UNKNOWN_ERROR',
      });
    }
    return order;
  }
}
