/**
 * @layer features
 * @segment health/api
 * @what Deep Ping API クエリ
 */

import { apiClient } from '@/shared/api/http';
import type { DeepPingResponse } from './types';

/**
 * Deep Ping を実行
 */
export async function fetchDeepPing(): Promise<DeepPingResponse> {
  return apiClient<DeepPingResponse>('/ping/deep');
}
