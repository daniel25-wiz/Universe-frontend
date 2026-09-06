/**
 * Product hooks — consume the productsApi service with TanStack Query.
 * Components never know whether data comes from mock or real backend.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/services/products';
import { ApiError } from '../api/errors';
import type { CreateProductRequest, Product, ProductQueryParams, UpdateProductRequest } from '../api/types';

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
