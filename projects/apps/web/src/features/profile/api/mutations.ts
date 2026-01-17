/**
 * @layer features
 * @segment profile
 * @what プロフィール関連の React Query Mutations
 * @why 名前変更/パスワード変更の API 呼び出しを管理
 */

import { useMutation } from '@tanstack/react-query';
import { getConfig } from '@/shared/config';
import { useAuthStore } from '@/features/auth';

interface UpdateNameRequest {
  name: string;
}

interface UpdateNameResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface MessageResponse {
  message: string;
}

interface ApiError {
  code: string;
  message: string;
}

async function updateNameApi(data: UpdateNameRequest): Promise<UpdateNameResponse> {
  const config = getConfig();
  const accessToken = useAuthStore.getState().accessToken;

  const response = await fetch(`${config.apiBaseUrl}/users/me/name`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to update name');
  }

  return response.json();
}

async function updatePasswordApi(data: UpdatePasswordRequest): Promise<MessageResponse> {
  const config = getConfig();
  const accessToken = useAuthStore.getState().accessToken;

  const response = await fetch(`${config.apiBaseUrl}/users/me/password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to update password');
  }

  return response.json();
}

export function useUpdateName() {
  return useMutation({
    mutationFn: updateNameApi,
  });
}

export function useUpdatePassword() {
  const clearTokens = useAuthStore((state) => state.clearTokens);

  return useMutation({
    mutationFn: updatePasswordApi,
    onSuccess: () => {
      // パスワード変更後はリフレッシュトークンが無効化されるため、ログアウト状態にする
      clearTokens();
    },
  });
}
