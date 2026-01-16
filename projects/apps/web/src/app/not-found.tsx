/**
 * @layer app
 * @what カスタム 404 ページ
 */

// Force dynamic rendering to avoid SSG issues
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <main>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </main>
  );
}
