/**
 * components/functionless/general/SubmitButton.tsx
 *
 *  - 送信ボタン（conform対応）
 */

import { useFormStatus } from 'react-dom'

type ButtonProps = {
  children?: React.ReactNode
}

export function SubmitButton({ children }: ButtonProps) {
  // ✅ useFormStatusで送信状態を取得
  const { pending } = useFormStatus()

  return (
    <button
      disabled={pending}
      type="submit"
      className="bg-blue-500 text-white p-2 rounded-md disabled:bg-gray-400 w-full"
    >
      {pending ? 'Submitting...' : children || 'Submit'}
    </button>
  )
}
