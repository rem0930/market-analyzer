/**
 * @layer features
 * @segment trade-area-management
 * @what 商圏データ取得の React Query Queries
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { getConfig } from '@/shared/config';
import { useAuthStore } from '@/features/auth/model/store';
import type { TradeArea, TradeAreasResponse } from '@/entities/trade-area';

function getAuthHeaders(): HeadersInit {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function listTradeAreasApi(): Promise<TradeAreasResponse> {
  const config = getConfig();
  const response = await fetch(`${config.apiBaseUrl}/trade-areas`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch trade areas');
  }

  return response.json();
}

async function getTradeAreaApi(id: string): Promise<TradeArea> {
  const config = getConfig();
  const response = await fetch(`${config.apiBaseUrl}/trade-areas/${id}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch trade area');
  }

  return response.json();
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
