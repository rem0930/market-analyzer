/**
 * @layer features
 * @segment competitor-management
 * @what 競合店舗データ取得の React Query Queries
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { useAuthStore } from '@/features/auth';
import type { CompetitorsResponse } from '@/entities/competitor';

function getAuthHeaders(): Record<string, string> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function listCompetitorsByStoreApi(storeId: string): Promise<CompetitorsResponse> {
  return apiClient<CompetitorsResponse>(`/stores/${encodeURIComponent(storeId)}/competitors`, {
    headers: getAuthHeaders(),
  });
}

export const competitorKeys = {
  byStore: (storeId: string) => ['competitors', 'store', storeId] as const,
  detail: (id: string) => ['competitors', id] as const,
};

export function useCompetitorsByStore(storeId: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: competitorKeys.byStore(storeId!),
    queryFn: () => listCompetitorsByStoreApi(storeId!),
    enabled: isAuthenticated && storeId !== null,
  });
}
