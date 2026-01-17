/**
 * @layer features
 * @segment profile
 * @what プロフィール編集フォーム UI（名前変更 + パスワード変更を統合）
 */
'use client';

import { NameChangeForm } from './NameChangeForm';
import { PasswordChangeForm } from './PasswordChangeForm';

interface ProfileEditFormProps {
  currentName?: string;
}

export function ProfileEditForm({ currentName }: ProfileEditFormProps) {
  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md space-y-8">
      <h2 className="text-2xl font-semibold text-center text-gray-800">プロフィール編集</h2>

      <div className="border-b border-gray-200 pb-6">
        <NameChangeForm currentName={currentName} />
      </div>

      <PasswordChangeForm />
    </div>
  );
}
