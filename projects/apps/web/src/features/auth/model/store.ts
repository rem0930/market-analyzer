/**
 * @layer features
 * @segment auth
 * @what 認証状態の Zustand ストア
 * @why クライアントサイドの認証状態を管理
 */

import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
  getAccessToken: () => string | null;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setTokens: (accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', refreshToken);
      // middleware (server-side) が認証判定に cookie を使うため cookie にも保存
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `refreshToken=${encodeURIComponent(refreshToken)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict${secure}`;
    }
    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refreshToken');
      document.cookie = 'refreshToken=; path=/; max-age=0';
    }
    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  getAccessToken: () => get().accessToken,
}));

// localStorage から refreshToken を復元し、accessToken を再取得
export async function initializeAuthStore() {
  if (typeof window === 'undefined') return;

  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return;

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // リフレッシュ失敗 → トークンをクリア
      useAuthStore.getState().clearTokens();
      return;
    }

    const data = await response.json();
    if (!data.accessToken || !data.refreshToken) {
      useAuthStore.getState().clearTokens();
      return;
    }
    useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
  } catch {
    useAuthStore.getState().clearTokens();
  }
}
