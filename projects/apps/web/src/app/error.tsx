'use client';

/**
 * @layer app
 * @what Next.js App Router エラーバウンダリ
 * @why クライアントサイドエラーをキャッチしてユーザーフレンドリーなUIを表示
 */

import { useEffect } from 'react';
import { Button } from '@/shared/ui';
import { getConfig } from '@/shared/config';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const config = getConfig();

  useEffect(() => {
    // TODO: エラーログサービスに送信
    console.error('Application error:', error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          エラーが発生しました
        </h2>
        <p className="text-gray-600 mb-6">
          申し訳ありません。予期しないエラーが発生しました。
        </p>
        {config.isDevelopment && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              エラー詳細
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
        <Button onClick={reset} variant="primary">
          もう一度試す
        </Button>
      </div>
    </main>
  );
}
