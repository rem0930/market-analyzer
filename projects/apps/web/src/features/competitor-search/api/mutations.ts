/**
 * @layer features
 * @segment competitor-search
 * @what 競合一括登録の React Query Mutations
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { useAuthStore } from '@/features/auth/model/store';
import type {
  BulkCreateCompetitorsRequest,
  BulkCreateCompetitorsResponse,
} from '@/entities/competitor';
import { competitorSearchKeys } from './queries';

function getAuthHeaders(): Record<string, string> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function bulkCreateCompetitorsApi(params: {
  storeId: string;
  data: BulkCreateCompetitorsRequest;
}): Promise<BulkCreateCompetitorsResponse> {
  return apiClient<BulkCreateCompetitorsResponse>(
    `/stores/${encodeURIComponent(params.storeId)}/competitors/bulk`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params.data),
    }
  );
}

export function useBulkCreateCompetitors() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkCreateCompetitorsApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: competitorSearchKeys.all });
    },
  });
}
