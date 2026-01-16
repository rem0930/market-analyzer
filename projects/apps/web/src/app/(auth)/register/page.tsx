/**
 * @layer app
 * @what 新規登録ページ
 */

import { RegisterForm } from '@/features/auth';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Create Account</h1>
      <RegisterForm />
    </>
  );
}
