/**
 * @layer widgets
 * @segment header
 * @what ヘッダー UI コンポーネント
 */
import Link from 'next/link';

export function Header() {
  return (
    <header>
      <nav>
        <Link href="/">Home</Link>
      </nav>
    </header>
  );
}
