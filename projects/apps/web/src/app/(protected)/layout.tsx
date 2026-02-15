'use client';

/**
 * @layer app
 * @what 保護されたページのレイアウト
 * @why 認証が必要なページの共通レイアウト
 */

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, initializeAuthStore } from '@/features/auth';
import { Header } from '@/widgets/header';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!isAuthenticated) {
        await initializeAuthStore();
      }
      setIsInitialized(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        router.replace('/login');
      }
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
