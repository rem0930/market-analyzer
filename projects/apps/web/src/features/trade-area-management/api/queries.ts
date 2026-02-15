/**
 * @layer features
 * @segment trade-area-management
 * @what 商圏データ取得の React Query Queries
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { useAuthStore } from '@/features/auth/model/store';
import type { TradeArea, TradeAreasResponse } from '@/entities/trade-area';

function getAuthHeaders(): Record<string, string> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function listTradeAreasApi(): Promise<TradeAreasResponse> {
  return apiClient<TradeAreasResponse>('/trade-areas', {
    headers: getAuthHeaders(),
  });
}

async function getTradeAreaApi(id: string): Promise<TradeArea> {
  return apiClient<TradeArea>(`/trade-areas/${encodeURIComponent(id)}`, {
    headers: getAuthHeaders(),
  });
}

export const tradeAreaKeys = {
  all: ['tradeAreas'] as const,
  detail: (id: string) => ['tradeAreas', id] as const,
  demographics: (id: string) => ['tradeAreas', id, 'demographics'] as const,
};

export function useTradeAreaList() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: tradeAreaKeys.all,
    queryFn: listTradeAreasApi,
    enabled: isAuthenticated,
  });
}

export function useTradeArea(id: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: tradeAreaKeys.detail(id ?? ''),
    queryFn: () => getTradeAreaApi(id!),
    enabled: isAuthenticated && id !== null,
  });
}
