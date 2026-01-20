/**
 * @layer shared
 * @segment ui
 * @what 再利用可能なフォームフィールドコンポーネント
 * @why フォームの入力フィールドとエラー表示を統一
 */

import type { InputHTMLAttributes, ReactNode } from 'react';
import type { FieldError } from 'react-hook-form';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
  children?: ReactNode;
}

export function FormField({
  label,
  error,
  id,
  children,
  className = '',
  ...props
}: FormFieldProps) {
  const inputId = id ?? props.name;

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children ?? (
        <input
          id={inputId}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-600" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
