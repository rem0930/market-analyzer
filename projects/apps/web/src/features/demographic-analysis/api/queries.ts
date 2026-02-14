/**
 * @layer features
 * @segment demographic-analysis
 * @what 人口統計データ取得の React Query Queries
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { getConfig } from '@/shared/config';
import { useAuthStore } from '@/features/auth/model/store';
import type { DemographicData } from '@/entities/trade-area';
import { tradeAreaKeys } from '@/features/trade-area-management';

async function getDemographicsApi(tradeAreaId: string): Promise<DemographicData> {
  const config = getConfig();
  const accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${config.apiBaseUrl}/trade-areas/${tradeAreaId}/demographics`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch demographics');
  }

  return response.json();
}

export function useDemographics(tradeAreaId: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: tradeAreaKeys.demographics(tradeAreaId ?? ''),
    queryFn: () => getDemographicsApi(tradeAreaId!),
    enabled: isAuthenticated && tradeAreaId !== null,
  });
}
