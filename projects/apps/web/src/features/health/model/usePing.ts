/**
 * @layer features
 * @segment health/model
 * @what Deep Ping 実行フック
 */

'use client';

import { useState, useCallback } from 'react';
import { fetchDeepPing, type DeepPingResponse } from '../api';

export interface UsePingState {
  data: DeepPingResponse | null;
  isLoading: boolean;
  error: string | null;
}

export interface UsePingReturn extends UsePingState {
  ping: () => Promise<void>;
  reset: () => void;
}

/**
 * Deep Ping を実行するカスタムフック
 */
export function usePing(): UsePingReturn {
  const [state, setState] = useState<UsePingState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const ping = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await fetchDeepPing();
      setState({ data, isLoading: false, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to ping server';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    ping,
    reset,
  };
}
