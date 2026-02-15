/**
 * @layer features
 * @segment store-management
 * @what 店舗データ取得の React Query Queries
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { useAuthStore } from '@/features/auth/model/store';
import type { Store, StoresResponse } from '@/entities/store';

function getAuthHeaders(): Record<string, string> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function listStoresApi(): Promise<StoresResponse> {
  return apiClient<StoresResponse>('/stores', {
    headers: getAuthHeaders(),
  });
}

async function getStoreApi(id: string): Promise<Store> {
  return apiClient<Store>(`/stores/${encodeURIComponent(id)}`, {
    headers: getAuthHeaders(),
  });
}

export const storeKeys = {
  all: ['stores'] as const,
  detail: (id: string) => ['stores', id] as const,
};

export function useStoreList() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: storeKeys.all,
    queryFn: listStoresApi,
    enabled: isAuthenticated,
  });
}

export function useStore(id: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: storeKeys.detail(id!),
    queryFn: () => getStoreApi(id!),
    enabled: isAuthenticated && id !== null,
  });
}
