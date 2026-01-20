/**
 * @layer features
 * @segment auth
 * @what ログインフォーム UI
 */
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useAuth } from '../model/useAuth';
import { typedLoginSchema, type LoginFormData } from '@/shared/lib/validation';
import { Button, FormField } from '@/shared/ui';

export function LoginForm() {
  const { isAuthenticated, login, logout, isLoading, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(typedLoginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data.email, data.password);
  };

  if (isAuthenticated) {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <p className="text-lg text-center text-green-600 mb-4">ログインしました</p>
        <Button onClick={logout} variant="danger" className="w-full">
          ログアウト
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-md p-6 bg-white rounded-lg shadow-md space-y-4"
    >
      <h2 className="text-2xl font-semibold text-center text-gray-800">ログイン</h2>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md" role="alert">
          {error}
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
        placeholder="パスワードを入力"
        autoComplete="current-password"
        error={errors.password}
        {...register('password')}
      />

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'ログイン中...' : 'ログイン'}
      </Button>

      <p className="text-center text-sm text-gray-600">
        アカウントをお持ちでない方は{' '}
        <Link href="/register" className="text-blue-600 hover:underline">
          新規登録
        </Link>
      </p>
    </form>
  );
}
