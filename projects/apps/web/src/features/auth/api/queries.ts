/**
 * @layer features
 * @segment auth
 * @what 認証関連の React Query Queries
 * @why 現在のユーザー情報取得などの API 呼び出しを管理
 */

import { useQuery } from '@tanstack/react-query';
import { getConfig } from '@/shared/config';
import { useAuthStore } from '../model/store';

interface CurrentUser {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

async function getCurrentUserApi(): Promise<CurrentUser> {
  const config = getConfig();
  const accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${config.apiBaseUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  return response.json();
}

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUserApi,
    enabled: isAuthenticated,
  });
}
