// utils/server-action-wrapper.ts
'use client'

import {
  ACTION_STATUS,
  type ActionState,
  type FormFields,
  type ValidationErrors,
} from '@/utils/actions'
import { useToast } from '@/utils/hooks/useToast'

/**
 * Server Action用高階関数のオプション
 */
type ServerActionWrapperOptions<
  T extends FormFields = FormFields,
  U extends ValidationErrors = ValidationErrors,
> = {
  /** 成功時のコールバック関数 */
  onSuccess: (params: { success: (message: string) => void }) => void
  /** 初期状態（リセット時に使用） */
  initialState: ActionState<T, U>
}

/**
 * Server Actionをラップする高階関数
 *
 * 共通の処理（エラーハンドリング、トースト表示、リダイレクト等）を抽象化
 * FormDataの変換・バリデーションはServer Action側の責務とする
 *
 * @param serverAction - 実行するServer Action
 * @param options - 設定オプション
 * @returns ラップされたアクション関数
 */
export function useServerActionWrapper<
  T extends FormFields = FormFields,
  U extends ValidationErrors = ValidationErrors,
>(
  serverAction: (prevState: ActionState<T, U>, formData: FormData) => Promise<ActionState<T, U>>,
  options: ServerActionWrapperOptions<T, U>,
) {
  const { success, error } = useToast()

  return async (prevState: ActionState<T, U>, formData: FormData): Promise<ActionState<T, U>> => {
    // Server Actionを実行
    const result = await serverAction(prevState, formData)

    // 結果に応じて処理を分岐
    switch (result.status) {
      case ACTION_STATUS.SUCCESS:
        // 成功時：コールバック関数を実行
        options.onSuccess({ success })
        // 初期状態に戻す（フォームをクリア）
        return options.initialState

      case ACTION_STATUS.VALIDATION_ERROR:
        // バリデーションエラー時：エラートースト表示
        error(result.error)
        return result

      case ACTION_STATUS.SERVER_ERROR:
        // サーバーエラー時：エラートースト表示
        error(result.error)
        return result

      default:
        // 予期しない状態の場合は現在の状態を維持
        return result
    }
  }
}

/**
 * 初期状態作成のヘルパー関数
 *
 * @returns 標準的な初期状態
 */
export function createInitialActionState<
  T extends FormFields = FormFields,
  U extends ValidationErrors = ValidationErrors,
>(): ActionState<T, U> {
  return {
    status: ACTION_STATUS.IDLE,
    error: null,
    validationErrors: null,
  } as ActionState<T, U>
}
