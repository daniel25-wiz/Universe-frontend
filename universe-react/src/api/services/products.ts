/**
 * Products API contract + factory. Same interface for mock and real backends.
 */
import type {
  CreateProductRequest,
  Product,
  ProductQueryParams,
  PaginatedResponse,
  UpdateProductRequest,
} from '../types';
import { apiConfig } from '../config';
import { MockProductsApi } from '../mock/products.mock';
import { RealProductsApi } from '../real/products.api';

export interface ProductsApi {
  getProducts(params?: ProductQueryParams): Promise<PaginatedResponse<Product>>;
  getProduct(id: string): Promise<Product>;
  createProduct(data: CreateProductRequest): Promise<Product>;
  updateProduct(id: string, data: UpdateProductRequest): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
}

export const productsApi: ProductsApi =
  apiConfig.mode === 'real' ? new RealProductsApi() : new MockProductsApi();