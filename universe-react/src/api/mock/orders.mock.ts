/**
 * Mock Orders API — implements the OrdersApi contract against the mock DB.
 *
 * SIMULATION SCOPE: the mock may simulate successful order creation (it is a
 * development stand-in for the real backend). The REAL adapter never does.
 *
 * Behavior:
 * - createOrder validates the payload the same way the contract requires the
 *   real backend to (non-empty items, quantities >= 1, delivery address
 *   fields) and, when a paymentReference is supplied, requires a payment the
 *   mock payments API has verified in this browser.
 * - Orders are scoped to the signed-in buyer; other users never see them.
 * - getOrders/getOrder paginate over the buyer's own orders (newest first).
 */
import type { CreateOrderRequest, Order, OrderItem, OrderQueryParams, PaginatedResponse } from '../types';
import type { OrdersApi } from '../services/orders';
import { mockDb, generateId, nowIso } from './mockDatabase';
import { withMockLatency } from './mockLatency';
import { ApiError } from '../errors';
import { logApi } from '../logger';
import { requireSession } from './sessionGuard';
import { verifiedPaymentAmount } from './payments.mock';

/** Internal row shape — adds ownership fields the API responses strip out. */
interface StoredOrder extends Order {
  buyerId: string;
}

function failField(fieldErrors: Record<string, string>): never {
  throw new ApiError({
    message: 'Please correct the highlighted fields.',
    status: 422,
    code: 'VALIDATION_ERROR',
    fieldErrors,
  });
}

export class MockOrdersApi implements OrdersApi {
  async getOrders(params: OrderQueryParams = {}): Promise<PaginatedResponse<Order>> {
    logApi('GET', '/orders');
    return withMockLatency((async () => {
      const { user } = await requireSession();
      const mine = mockDb
        .query('orders', (o) => (o as StoredOrder).buyerId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const page = Math.max(1, params.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
      const start = (page - 1) * pageSize;
      return {
        items: mine.slice(start, start + pageSize),
        total: mine.length,
        page,
        pageSize,
      };
    })());
  }

  /**
   * Seller-side order list: orders containing at least one product the
   * signed-in seller owns, newest first. Sales Analytics reads from this, so
   * every number it shows is derived from real order rows — this mock only
   * replays what the mock DB holds, exactly like the real backend will.
   */
  async getSellerOrders(params: OrderQueryParams = {}): Promise<PaginatedResponse<Order>> {
    logApi('GET', '/seller/orders');
    return withMockLatency((async () => {
      const { user } = await requireSession();
      if (user.accountType !== 'seller') {
        throw new ApiError({
          message: 'Only seller accounts can view seller orders.',
          status: 403,
          code: 'FORBIDDEN',
        });
      }
      const since = params.since ? new Date(params.since).getTime() : null;
      const until = params.until ? new Date(params.until).getTime() : null;
      const mine = mockDb
        .query('orders', (o) => {
          const order = o as StoredOrder;
          // A seller sees an order only when one of THEIR products is on it.
          if (!Array.isArray(order.items) || !order.items.some((item) => item.sellerId === user.id)) {
            return false;
          }
          const created = new Date(order.createdAt).getTime();
          if (Number.isNaN(created)) return false;
          if (since != null && created < since) return false;
          if (until != null && created > until) return false;
          return true;
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const page = Math.max(1, params.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
      const start = (page - 1) * pageSize;
      return {
        items: mine.slice(start, start + pageSize),
        total: mine.length,
        page,
        pageSize,
      };
    })());
  }

  async getOrder(id: string): Promise<Order> {
    logApi('GET', `/orders/${id}`);
    return withMockLatency((async () => {
      const { user } = await requireSession();
      const order = mockDb.findById('orders', id) as StoredOrder | null;
      // Hide the existence of other buyers' orders (404, not 403).
      if (!order || order.buyerId !== user.id) {
        throw new ApiError({ message: 'Order not found.', status: 404, code: 'NOT_FOUND' });
      }
      return order;
    })());
  }

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    logApi('POST', '/orders');
    return withMockLatency((async () => {
      const { user } = await requireSession();

      const errors: Record<string, string> = {};
      if (!Array.isArray(data.items) || data.items.length === 0) {
        errors.items = 'Add at least one item before placing the order';
      }
      const delivery = data.deliveryAddress;
      if (!delivery || typeof delivery !== 'object') {
        errors.deliveryAddress = 'Delivery information is required';
      } else {
        if (!delivery.fullName?.trim()) errors['deliveryAddress.fullName'] = 'Full name is required';
        if (!delivery.phone?.trim()) errors['deliveryAddress.phone'] = 'Phone number is required';
        if (!delivery.addressLine1?.trim()) errors['deliveryAddress.addressLine1'] = 'Address is required';
        if (!delivery.city?.trim()) errors['deliveryAddress.city'] = 'City is required';
      }
      if (Object.keys(errors).length > 0) failField(errors);

      // Build the REAL line items from the catalog: the CATALOG owns the
      // price (mirrors the real backend recomputing totals) and each line
      // carries its sellerId so seller analytics can attribute revenue.
      const items: OrderItem[] = [];
      for (const item of data.items) {
        const product = mockDb.findById('products', item.productId);
        if (!product || product.status !== 'active') {
          // Same anti-enumeration stance as the products API.
          throw new ApiError({
            message: 'One of the items is no longer available.',
            status: 404,
            code: 'NOT_FOUND',
          });
        }
        if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
          failField({ items: 'Quantities must be between 1 and 99' });
        }
        const unitPrice = product.salePrice ?? product.price;
        items.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice,
          lineTotal: unitPrice != null ? unitPrice * item.quantity : null,
          sellerId: product.sellerId ?? null,
        });
      }

      // Payment must be verified BEFORE order creation when a reference is
      // part of the flow (contract rule; see docs/API_CONTRACT.md).
      let amount: number | null = null;
      if (data.paymentReference) {
        const verified = verifiedPaymentAmount(data.paymentReference);
        if (verified === null) {
          throw new ApiError({
            message: 'This payment has not been verified. Complete the payment first.',
            status: 402,
            code: 'CONFLICT',
          });
        }
        amount = verified;
      } else {
        amount = items.reduce((sum, item) => sum + (item.lineTotal ?? 0), 0);
      }

      const timestamp = nowIso();
      const order: StoredOrder = {
        id: generateId(),
        reference: `UNI-${Date.now().toString(36).toUpperCase()}`,
        buyerId: user.id,
        buyerName: user.fullName,
        buyerInitials: user.fullName
          .split(/\s+/)
          .map((part) => part.charAt(0).toUpperCase())
          .slice(0, 2)
          .join(''),
        amount,
        // Fresh orders always start as "processing" — the backend owns any
        // later transitions.
        status: 'processing',
        createdAt: timestamp,
        items,
      };
      return mockDb.insert('orders', order as never);
    })());
  }
}
