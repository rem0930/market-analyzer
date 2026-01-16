/**
 * @layer shared
 * @segment ui
 * @what 再利用可能なエラーフォールバックコンポーネント
 * @why コンポーネント単位でのエラー表示に使用
 */

import { getConfig } from '@/shared/config';
import { Button } from './Button';

interface ErrorFallbackProps {
  error?: Error;
  message?: string;
  onRetry?: () => void;
}

export function ErrorFallback({
  error,
  message = 'エラーが発生しました',
  onRetry,
}: ErrorFallbackProps) {
  const config = getConfig();

  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
      <p className="text-red-600 font-medium mb-2">{message}</p>
      {error && config.isDevelopment && (
        <p className="text-sm text-red-500 mb-4">{error.message}</p>
      )}
      {onRetry && (
        <Button onClick={onRetry} variant="danger">
          再試行
        </Button>
      )}
    </div>
  );
}
