/**
 * Product hooks — consume the productsApi service with TanStack Query.
 * Components never know whether data comes from mock or real backend.
 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/services/products';
import { ApiError } from '../api/errors';
import type {
  CreateProductRequest,
  PaginatedResponse,
  Product,
  ProductQueryParams,
  UpdateProductRequest,
} from '../api/types';

const PRODUCTS_KEY = 'products';

function productsQueryKey(params?: ProductQueryParams) {
  return [PRODUCTS_KEY, params ?? {}];
}

/** Fetch a paginated product list, optionally filtered. */
export function useProducts(params?: ProductQueryParams) {
  return useQuery<Product[], ApiError>({
    queryKey: productsQueryKey(params),
    queryFn: async () => {
      const res = await productsApi.getProducts(params);
      return res.items;
    },
    placeholderData: (prev) => prev,
  });
}

/**
 * Paginated variant of `useProducts` for catalogs that can exceed one page
 * (the public marketplace). `fetchNextPage()` appends the next server page on
 * demand, so no product is unreachable just because it sits beyond the first
 * page — the backend still owns filtering and paging, one request per page.
 *
 * Data lives under its OWN query key (`['products', 'pages', params]`) because
 * an infinite query caches a different shape than `useProducts()`'s bare
 * array; sharing the key would hand one hook the other's data. Product writes
 * still refresh it: `invalidateQueries(['products'])` matches by key prefix.
 */
export function useInfiniteProducts(params?: ProductQueryParams) {
  const pageSize = params?.pageSize ?? 40;
  // `page` is driven by the infinite query itself, never by the caller.
  const filters = { ...(params ?? {}), page: undefined, pageSize };
  return useInfiniteQuery<PaginatedResponse<Product>, ApiError>({
    queryKey: [PRODUCTS_KEY, 'pages', filters],
    queryFn: ({ pageParam }) => productsApi.getProducts({ ...params, page: Number(pageParam), pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // A page with no items means the catalog is exhausted (or the backend
      // ignored `page`) — stop instead of re-requesting the same rows forever.
      if (lastPage.items.length === 0) return undefined;
      const loaded = allPages.reduce((count, page) => count + page.items.length, 0);
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}

/** Fetch a single product by id. */
export function useProduct(id: string) {
  return useQuery<Product, ApiError>({
    queryKey: [PRODUCTS_KEY, 'detail', id],
    queryFn: () => productsApi.getProduct(id),
    enabled: Boolean(id),
  });
}

/** Create a product — invalidates the product list on success. */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, ApiError, CreateProductRequest>({
    mutationFn: (data) => productsApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

/** Update a product — invalidates the list and detail cache on success. */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, ApiError, { id: string; data: UpdateProductRequest }>({
    mutationFn: ({ id, data }) => productsApi.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, 'detail', id] });
    },
  });
}

/** Delete a product — invalidates the product list on success. */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}
