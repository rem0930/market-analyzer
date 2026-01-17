/**
 * @layer features
 * @segment profile
 * @what パスワード変更フォーム UI
 */
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useUpdatePassword } from '../api';
import { typedUpdatePasswordSchema, type UpdatePasswordFormData } from '@/shared/lib/validation';
import { Button, FormField } from '@/shared/ui';

export function PasswordChangeForm() {
  const router = useRouter();
  const updatePasswordMutation = useUpdatePassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(typedUpdatePasswordSchema),
  });

  const onSubmit = (data: UpdatePasswordFormData) => {
    updatePasswordMutation.mutate(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          reset();
          // パスワード変更後はログアウトされるため、ログインページへリダイレクト
          router.push('/login?password_changed=true');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">パスワードの変更</h3>

      {updatePasswordMutation.error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md" role="alert">
          {updatePasswordMutation.error.message}
        </div>
      )}

      <FormField
        label="現在のパスワード"
        type="password"
        placeholder="現在のパスワードを入力"
        autoComplete="current-password"
        error={errors.currentPassword}
        {...register('currentPassword')}
      />

      <FormField
        label="新しいパスワード"
        type="password"
        placeholder="8文字以上、英数字を含む"
        autoComplete="new-password"
        error={errors.newPassword}
        {...register('newPassword')}
      />

      <FormField
        label="新しいパスワード（確認）"
        type="password"
        placeholder="新しいパスワードを再入力"
        autoComplete="new-password"
        error={errors.confirmPassword}
        {...register('confirmPassword')}
      />

      <Button
        type="submit"
        disabled={updatePasswordMutation.isPending}
        className="disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {updatePasswordMutation.isPending ? '変更中...' : 'パスワードを変更'}
      </Button>

      <p className="text-sm text-gray-500">
        パスワードを変更すると、セキュリティのため再ログインが必要になります。
      </p>
    </form>
  );
}
