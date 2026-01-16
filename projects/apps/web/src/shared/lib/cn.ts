/**
 * @layer shared
 * @segment lib
 * @what クラス名結合ユーティリティ（tailwind-merge 風）
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
