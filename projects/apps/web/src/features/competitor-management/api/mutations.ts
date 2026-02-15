/**
 * @layer features
 * @segment competitor-management
 * @what 競合店舗 CRUD の React Query Mutations
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { useAuthStore } from '@/features/auth/model/store';
import type {
  Competitor,
  CreateCompetitorRequest,
  UpdateCompetitorRequest,
} from '@/entities/competitor';
import { competitorKeys } from './queries';

function getAuthHeaders(): Record<string, string> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function createCompetitorApi(params: {
  storeId: string;
  data: CreateCompetitorRequest;
}): Promise<Competitor> {
  return apiClient<Competitor>(`/stores/${encodeURIComponent(params.storeId)}/competitors`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params.data),
  });
}

async function updateCompetitorApi(params: {
  id: string;
  data: UpdateCompetitorRequest;
}): Promise<Competitor> {
  return apiClient<Competitor>(`/competitors/${encodeURIComponent(params.id)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(params.data),
  });
}

async function deleteCompetitorApi(id: string): Promise<void> {
  return apiClient<void>(`/competitors/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export function useCreateCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompetitorApi,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: competitorKeys.byStore(variables.storeId),
      });
    },
  });
}

export function useUpdateCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCompetitorApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: competitorKeys.byStore(data.storeId),
      });
      queryClient.invalidateQueries({
        queryKey: competitorKeys.detail(data.id),
      });
    },
  });
}

export function useDeleteCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCompetitorApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
    },
  });
}
