/**
 * @layer app
 * @what ホームページ（ランディングページ）
 */

import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to Next.js + FSD</h1>
      <p className="text-gray-600 mb-8">A modern web application with Feature-Sliced Design</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Login
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
