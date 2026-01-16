/**
 * @layer app
 * @what Next.js App Router ルートレイアウト
 * @why 全ページ共通のレイアウト・プロバイダ設定
 */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/shared/ui/globals.css';

export const metadata: Metadata = {
  title: 'Web App',
  description: 'Next.js + FSD Application',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-100">{children}</body>
    </html>
  );
}
