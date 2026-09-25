/**
 * Storefront hooks — consume the storefrontApi service with TanStack Query.
 * The storefront is public: no session is required to view a store.
 */
import { useQuery } from '@tanstack/react-query';
import { storefrontApi } from '../api/services/storefront';
import { productsApi } from '../api/services/products';
import { ApiError } from '../api/errors';
import { normalizeStorefrontProduct } from '../api/real/storefront.normalize';
import type { Storefront } from '../api/types';

const STOREFRONT_KEY = 'storefront';

/** Resolve a store's private marketplace by domain slug. */
export function useStorefront(slug?: string) {
  return useQuery<Storefront, ApiError>({
    queryKey: [STOREFRONT_KEY, slug ?? ''],
    queryFn: async () => {
      const store = await storefrontApi.getStorefront(slug ?? '');
      if (store.products.length > 0 || !store.sellerId) return store;

      const catalog = await productsApi.getAllProducts({ sellerId: store.sellerId, pageSize: 50 });
      const products = catalog.items
        .map((product) => normalizeStorefrontProduct(product))
        .filter((product) => product !== null);
      const counts = products.reduce((result, product) => {
        result.all += 1;
        result[product.category] += 1;
        return result;
      }, { ...store.catalogCounts, all: 0 });
      return { ...store, products, catalogCounts: counts };
    },
    enabled: Boolean(slug),
    staleTime: 60 * 1000,
  });
}
