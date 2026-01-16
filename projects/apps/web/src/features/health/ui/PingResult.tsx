/**
 * @layer features
 * @segment health/ui
 * @what Deep Ping 結果表示コンポーネント
 */

'use client';

import type { DeepPingResponse, HealthCheck } from '../api';

interface PingResultProps {
  data: DeepPingResponse;
}

function StatusBadge({ status }: { status: 'ok' | 'degraded' | 'error' }) {
  const styles = {
    ok: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };

  const labels = {
    ok: 'OK',
    degraded: 'Degraded',
    error: 'Error',
  };

  return (
    <span className={`px-2 py-1 rounded text-sm font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function CheckItem({ check }: { check: HealthCheck }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-3">
        <span
          className={`w-2 h-2 rounded-full ${check.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <span className="font-medium capitalize">{check.name}</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        {check.message && <span>{check.message}</span>}
        <span className="tabular-nums">{check.latencyMs}ms</span>
      </div>
    </div>
  );
}

export function PingResult({ data }: PingResultProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Ping Result</h2>
        <StatusBadge status={data.status} />
      </div>

      <div className="text-sm text-gray-500 mb-4">
        <p>Timestamp: {new Date(data.timestamp).toLocaleString()}</p>
        <p>Total Latency: {data.totalLatencyMs}ms</p>
      </div>

      <div className="border rounded-lg p-3">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Health Checks</h3>
        {data.checks.map((check) => (
          <CheckItem key={check.name} check={check} />
        ))}
      </div>
    </div>
  );
}
