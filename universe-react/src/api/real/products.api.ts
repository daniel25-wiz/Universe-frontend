/**
 * Real Products API — implements the ProductsApi contract against the real backend.
 */
import type {
  CreateProductRequest,
  Product,
  ProductQueryParams,
  PaginatedResponse,
  UpdateProductRequest,
} from '../types';
import type { ProductsApi } from '../services/products';
import { httpClient } from './client';

function toQuery(params: ProductQueryParams = {}): string {
  const sp = new URLSearchParams();
  if (params.sellerId) sp.set('sellerId', params.sellerId);
  if (params.status) sp.set('status', params.status);
  if (params.category) sp.set('category', params.category);
  if (params.search) sp.set('search', params.search);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export class RealProductsApi implements ProductsApi {
  async getProducts(params: ProductQueryParams = {}): Promise<PaginatedResponse<Product>> {
    return httpClient.get<PaginatedResponse<Product>>(`/products${toQuery(params)}`);
  }

  async getProduct(id: string): Promise<Product> {
    return httpClient.get<Product>(`/products/${id}`);
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    return httpClient.post<Product>('/products', data);
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    return httpClient.patch<Product>(`/products/${id}`, data);
  }

  async deleteProduct(id: string): Promise<void> {
    return httpClient.delete<void>(`/products/${id}`);
  }
}
