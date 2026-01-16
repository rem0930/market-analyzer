/**
 * @layer app
 * @what Deep Ping ページ
 * @why フロントエンドからバックエンドへの疎通確認を行う
 */

'use client';

import { usePing, PingResult } from '@/features/health';
import { Button } from '@/shared/ui';

export default function PingPage() {
  const { data, isLoading, error, ping, reset } = usePing();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Deep Ping</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        Check the connectivity between the frontend and backend, including database health.
      </p>

      <div className="flex gap-4 mb-8">
        <Button onClick={ping} disabled={isLoading}>
          {isLoading ? 'Pinging...' : 'Ping'}
        </Button>
        {data && (
          <Button variant="secondary" onClick={reset}>
            Reset
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 max-w-md">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {data && <PingResult data={data} />}
    </main>
  );
}
