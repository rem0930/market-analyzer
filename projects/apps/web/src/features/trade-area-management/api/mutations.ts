/**
 * @layer features
 * @segment trade-area-management
 * @what 商圏 CRUD の React Query Mutations
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getConfig } from '@/shared/config';
import { useAuthStore } from '@/features/auth/model/store';
import type {
  TradeArea,
  CreateTradeAreaRequest,
  UpdateTradeAreaRequest,
} from '@/entities/trade-area';
import { tradeAreaKeys } from './queries';

function getAuthHeaders(): HeadersInit {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

async function createTradeAreaApi(data: CreateTradeAreaRequest): Promise<TradeArea> {
  const config = getConfig();
  const response = await fetch(`${config.apiBaseUrl}/trade-areas`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create trade area');
  }

  return response.json();
}

async function updateTradeAreaApi(params: {
  id: string;
  data: UpdateTradeAreaRequest;
}): Promise<TradeArea> {
  const config = getConfig();
  const response = await fetch(`${config.apiBaseUrl}/trade-areas/${params.id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(params.data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update trade area');
  }

  return response.json();
}

async function deleteTradeAreaApi(id: string): Promise<void> {
  const config = getConfig();
  const response = await fetch(`${config.apiBaseUrl}/trade-areas/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete trade area');
  }
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
