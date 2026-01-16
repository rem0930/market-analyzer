/**
 * @layer features
 * @segment health/api
 * @what Deep Ping API の型定義
 */

export interface HealthCheck {
  name: string;
  status: 'ok' | 'error';
  latencyMs: number;
  message?: string;
}

export interface DeepPingResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  totalLatencyMs: number;
  checks: HealthCheck[];
}
