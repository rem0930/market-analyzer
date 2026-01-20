'use client';

/**
 * @layer app
 * @what ダッシュボードページ
 */

import Link from 'next/link';
import { useCurrentUser, useLogout } from '@/features/auth';
import { Button } from '@/shared/ui';

export default function DashboardPage() {
  const { data: user, isLoading } = useCurrentUser();
  const logoutMutation = useLogout();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Welcome!</h2>
        {user && (
          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Account created:</span>{' '}
              {new Date(user.createdAt).toLocaleDateString('ja-JP')}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Link href="/profile">
          <Button variant="secondary">プロフィール編集</Button>
        </Link>

        <Button
          onClick={() => logoutMutation.mutate()}
          variant="danger"
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
    </div>
  );
}
