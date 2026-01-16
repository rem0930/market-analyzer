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
    // refreshToken は localStorage に保存（ページリロード対応）
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', refreshToken);
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
    }
    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  getAccessToken: () => get().accessToken,
}));

// localStorage から refreshToken を復元
export function initializeAuthStore() {
  if (typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      useAuthStore.setState({
        refreshToken,
        // accessToken は refresh API で取得する必要がある
      });
    }
  }
}
