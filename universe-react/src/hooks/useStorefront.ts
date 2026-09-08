/**
 * Storefront hooks — consume the storefrontApi service with TanStack Query.
 * The storefront is public: no session is required to view a store.
 */
import { useQuery } from '@tanstack/react-query';
import { storefrontApi } from '../api/services/storefront';
import { ApiError } from '../api/errors';
import type { Storefront } from '../api/types';

const STOREFRONT_KEY = 'storefront';

/** Resolve a store's private marketplace by domain slug. */
export function useStorefront(slug?: string) {
  return useQuery<Storefront, ApiError>({
    queryKey: [STOREFRONT_KEY, slug ?? ''],
    queryFn: () => storefrontApi.getStorefront(slug ?? ''),
    enabled: Boolean(slug),
    staleTime: 60 * 1000,
  });
}
