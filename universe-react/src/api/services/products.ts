/**
 * Products API contract + factory.
 *
 * Components/hooks only ever see this `productsApi` object which satisfies
 * the ProductsApi interface. Whether it currently resolves to the in-browser
 * mock or the real HTTP client depends ENTIRELY on VITE_API_MODE.
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
  /**
   * Server-side paginated list. ONE HTTP request — the backend owns
   * filtering, search and paging. When the backend caps pageSize it returns
   * its own maximum; the frontend never page-merges implicitly.
   */
  getProducts(params?: ProductQueryParams): Promise<PaginatedResponse<Product>>;
  getProduct(id: string): Promise<Product>;
  createProduct(data: CreateProductRequest): Promise<Product>;
  updateProduct(id: string, data: UpdateProductRequest): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  /**
   * OPT-IN aggregation: fetch every matching product by walking server
   * pages (capped, documented in docs/API_CONTRACT.md). Use ONLY for tooling
   * that genuinely needs the whole filtered catalog — e.g. an export. The
   * normal UI path is getProducts().
   */
  getAllProducts(params?: ProductQueryParams): Promise<PaginatedResponse<Product>>;
}

export const productsApi: ProductsApi =
  apiConfig.mode === 'real' ? new RealProductsApi() : new MockProductsApi();
