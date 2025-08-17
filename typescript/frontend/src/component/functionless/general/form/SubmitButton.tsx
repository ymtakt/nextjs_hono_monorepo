/**
 * components/functionless/general/SubmitButton.tsx
 *
 *  - 送信ボタン（conform対応）
 */

import { useFormStatus } from 'react-dom';

type ButtonProps = {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
};

export function SubmitButton({ children, variant = 'primary', size = 'md' }: ButtonProps) {
  // ✅ useFormStatusで送信状態を取得
  const { pending } = useFormStatus();

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }[size];

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-600 disabled:bg-gray-500',
    secondary:
      'bg-gray-100 text-foreground hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-500',
  }[variant];

  return (
    <button
      disabled={pending}
      type="submit"
      className={`w-full rounded-lg font-medium transition-colors ${sizeClasses} ${variantClasses}`}
    >
      {pending ? 'Submitting...' : children || 'Submit'}
    </button>
  );
}
