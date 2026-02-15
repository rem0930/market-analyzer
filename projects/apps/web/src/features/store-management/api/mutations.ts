/**
 * @layer features
 * @segment store-management
 * @what 店舗 CRUD の React Query Mutations
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { useAuthStore } from '@/features/auth/model/store';
import type { Store, CreateStoreRequest, UpdateStoreRequest } from '@/entities/store';
import { storeKeys } from './queries';

function getAuthHeaders(): Record<string, string> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function createStoreApi(data: CreateStoreRequest): Promise<Store> {
  return apiClient<Store>('/stores', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

async function updateStoreApi(params: { id: string; data: UpdateStoreRequest }): Promise<Store> {
  return apiClient<Store>(`/stores/${encodeURIComponent(params.id)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(params.data),
  });
}

async function deleteStoreApi(id: string): Promise<void> {
  return apiClient<void>(`/stores/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStoreApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStoreApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all });
      queryClient.invalidateQueries({
        queryKey: storeKeys.detail(data.id),
      });
    },
  });
}

export function useDeleteStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStoreApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all });
    },
  });
}
