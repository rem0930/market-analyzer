/**
 * @layer features
 * @segment auth
 * @what 認証関連の React Query Mutations
 * @why ログイン/ログアウト/登録などの API 呼び出しを管理
 */

import { useMutation } from '@tanstack/react-query';
import { getConfig } from '@/shared/config';
import { useAuthStore } from '../model/store';

interface LoginRequest {
  email: string;
  password: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

interface ApiError {
  code: string;
  message: string;
}

async function loginApi(data: LoginRequest): Promise<TokenResponse> {
  const config = getConfig();
  const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

async function logoutApi(refreshToken: string): Promise<void> {
  const config = getConfig();
  const accessToken = useAuthStore.getState().accessToken;

  await fetch(`${config.apiBaseUrl}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ refreshToken }),
  });
}

export function useLogin() {
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
    },
  });
}

export function useLogout() {
  const { refreshToken, clearTokens } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    },
    onSettled: () => {
      clearTokens();
    },
  });
}
