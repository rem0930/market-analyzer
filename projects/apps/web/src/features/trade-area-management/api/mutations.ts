/**
 * @layer features
 * @segment trade-area-management
 * @what 商圏 CRUD の React Query Mutations
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { useAuthStore } from '@/features/auth/model/store';
import type {
  TradeArea,
  CreateTradeAreaRequest,
  UpdateTradeAreaRequest,
} from '@/entities/trade-area';
import { tradeAreaKeys } from './queries';

function getAuthHeaders(): Record<string, string> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function createTradeAreaApi(data: CreateTradeAreaRequest): Promise<TradeArea> {
  return apiClient<TradeArea>('/trade-areas', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

async function updateTradeAreaApi(params: {
  id: string;
  data: UpdateTradeAreaRequest;
}): Promise<TradeArea> {
  return apiClient<TradeArea>(`/trade-areas/${params.id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(params.data),
  });
}

async function deleteTradeAreaApi(id: string): Promise<void> {
  return apiClient<void>(`/trade-areas/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export function useCreateTradeArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTradeAreaApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradeAreaKeys.all });
    },
  });
}

export function useUpdateTradeArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTradeAreaApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tradeAreaKeys.all });
      queryClient.invalidateQueries({
        queryKey: tradeAreaKeys.detail(data.id),
      });
    },
  });
}

export function useDeleteTradeArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTradeAreaApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradeAreaKeys.all });
    },
  });
}
