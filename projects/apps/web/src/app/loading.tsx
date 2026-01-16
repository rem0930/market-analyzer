/**
 * @layer app
 * @what Next.js App Router ローディング状態
 * @why ページ遷移時やサスペンス中のローディングUIを表示
 */

export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-600">読み込み中...</p>
      </div>
    </main>
  );
}
