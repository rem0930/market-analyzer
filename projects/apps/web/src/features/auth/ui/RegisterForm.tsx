/**
 * @layer features
 * @segment auth
 * @what 新規登録フォーム UI
 */
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRegister } from '../api';
import { registerSchema, type RegisterFormData } from '@/shared/lib/validation';
import { Button, FormField } from '@/shared/ui';

export function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(registerSchema as any),
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          router.push('/login?registered=true');
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-md p-6 bg-white rounded-lg shadow-md space-y-4"
    >
      <h2 className="text-2xl font-semibold text-center text-gray-800">
        新規登録
      </h2>

      {registerMutation.error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md" role="alert">
          {registerMutation.error.message}
        </div>
      )}

      <FormField
        label="メールアドレス"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email}
        {...register('email')}
      />

      <FormField
        label="パスワード"
        type="password"
        placeholder="8文字以上、英数字を含む"
        autoComplete="new-password"
        error={errors.password}
        {...register('password')}
      />

      <FormField
        label="パスワード確認"
        type="password"
        placeholder="パスワードを再入力"
        autoComplete="new-password"
        error={errors.confirmPassword}
        {...register('confirmPassword')}
      />

      <Button
        type="submit"
        disabled={registerMutation.isPending}
        className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {registerMutation.isPending ? '登録中...' : '登録する'}
      </Button>

      <p className="text-center text-sm text-gray-600">
        既にアカウントをお持ちの方は{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          ログイン
        </Link>
      </p>
    </form>
  );
}
