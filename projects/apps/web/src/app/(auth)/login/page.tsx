/**
 * @layer app
 * @what ログインページ
 */

import { Suspense } from 'react';
import { LoginForm } from '@/features/auth';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Welcome Back</h1>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </>
  );
}
