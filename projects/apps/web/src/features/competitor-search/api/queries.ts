/**
 * @layer features
 * @segment competitor-search
 * @what 競合検索の React Query Queries
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { useAuthStore } from '@/features/auth/model/store';
import type { SearchCompetitorsRequest, SearchCompetitorsResponse } from '@/entities/competitor';

function getAuthHeaders(): Record<string, string> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function searchCompetitorsApi(
  storeId: string,
  params: SearchCompetitorsRequest
): Promise<SearchCompetitorsResponse> {
  return apiClient<SearchCompetitorsResponse>(
    `/stores/${encodeURIComponent(storeId)}/competitors/search`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    }
  );
}

export const competitorSearchKeys = {
  all: ['competitor-search'] as const,
  search: (storeId: string, params: SearchCompetitorsRequest) =>
    ['competitor-search', storeId, params] as const,
};

export function useSearchCompetitors(
  storeId: string | null,
  params: SearchCompetitorsRequest | null
) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: competitorSearchKeys.search(storeId!, params!),
    queryFn: () => searchCompetitorsApi(storeId!, params!),
    enabled: isAuthenticated && storeId !== null && params !== null,
  });
}
