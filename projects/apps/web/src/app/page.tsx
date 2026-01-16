/**
 * @layer app
 * @what ホームページ
 */

import { LoginForm } from '@/features/auth';

// Force dynamic rendering to avoid SSG issues
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-8">Welcome to Next.js + FSD</h1>
      <LoginForm />
    </main>
  );
}
