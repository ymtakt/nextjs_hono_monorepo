import type { ZodError } from 'zod'
import { useToast } from './hook/useToast'

/**
 * フォームフィールドの型制約
 */
export type FormFields = Record<string, unknown>

/**
 * バリデーションエラーの型制約
 */
export type ValidationErrors = Record<string, string[]>

/**
 * サーバーアクションで定義するFormStateの型
 *
 * サーバーアクションで定義するFormStateは、BaseActionStateを継承する
 */
export const ACTION_STATUS = {
  // 初期状態
  IDLE: 'idle',
  // 成功
  SUCCESS: 'success',
  // バリデーションエラー
  VALIDATION_ERROR: 'validation_error',
  // サーバーエラー
  SERVER_ERROR: 'server_error',
} as const

export type ActionStatus = (typeof ACTION_STATUS)[keyof typeof ACTION_STATUS]

export type BaseActionState<T extends ValidationErrors> =
  | {
      status: typeof ACTION_STATUS.IDLE
      error: null
      validationErrors: null
    }
  | {
      status: typeof ACTION_STATUS.SUCCESS
      error: null
      validationErrors: null
    }
  | {
      status: typeof ACTION_STATUS.VALIDATION_ERROR
      error: string
      validationErrors: T | null
    }
  | {
      status: typeof ACTION_STATUS.SERVER_ERROR
      error: string
      validationErrors: null
    }

export type ActionState<
  T extends FormFields = FormFields,
  U extends ValidationErrors = ValidationErrors,
> = BaseActionState<U> & T

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
export function withServerActionHandling<
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
 * Zodエラーから最初のエラーメッセージを抽出
 *
 * zodのバリデーションエラーから全フィールドのエラーメッセージを収集し、
 * 最初に見つかったエラーメッセージを返す
 *
 * @template T - zodスキーマの型
 * @param error - zodのバリデーションエラーオブジェクト
 * @returns
 *
 */
export function extractZodErrorMessage<T>(error: ZodError<T>): string {
  const fieldErrors = error.flatten().fieldErrors
  const allErrors: string[] = []

  for (const errors of Object.values(fieldErrors)) {
    if (Array.isArray(errors)) {
      allErrors.push(...errors)
    }
  }

  return allErrors[0] || 'バリデーションエラー'
}

/**
 * バリデーションエラーを表示用メッセージに変換（汎用版）
 *
 * zodバリデーションエラーの識別子を人間が読めるメッセージに変換する
 * 各Server Actionで使用され、型安全なエラーメッセージ変換を提供
 *
 * @template T - バリデーションエラー型（例：TodoValidationErrors）
 * @param fieldErrors - zodのerror.flatten().fieldErrorsから取得したフィールドエラー
 *                      形式：{ fieldName: ['ERROR_CODE1', 'ERROR_CODE2'] | undefined }
 * @param messageMap - エラーコードと表示用メッセージのマップ
 *                     形式：{ ERROR_CODE: '表示用メッセージ' }
 * @param validFields - 有効なフィールド名のリスト（型安全性のため）
 * @returns 変換されたエラーオブジェクト（各フィールドに表示用メッセージ配列）
 *
 */
export function convertValidationErrors<T extends Record<string, string[]>>(
  fieldErrors: Record<string, string[] | undefined>,
  messageMap: Record<string, string>,
  validFields: readonly (keyof T)[],
): T {
  const convertedErrors: Partial<T> = {}

  for (const [key, errors] of Object.entries(fieldErrors)) {
    if (Array.isArray(errors) && errors.length > 0 && validFields.includes(key as keyof T)) {
      const convertedMessages = errors.map(
        (errorCode) => messageMap[errorCode] || 'エラーが発生しました',
      )
      ;(convertedErrors as any)[key] = convertedMessages
    }
  }

  return convertedErrors as T
}

/**
 * 最初のバリデーションエラーメッセージを取得（汎用版）
 *
 * 複数のフィールドにエラーがある場合、指定された順序で最初のエラーメッセージを取得
 * ユーザーに表示する代表的なエラーメッセージを決定するために使用
 *
 * @template T - バリデーションエラー型（例：TodoValidationErrors）
 * @param validationErrors - 変換済みのバリデーションエラー（表示用メッセージ）
 * @param fieldOrder - チェックするフィールドの優先順序
 *                     最初のフィールドから順番にエラーをチェック
 * @param defaultMessage - エラーが見つからない場合のデフォルトメッセージ
 * @returns 最初に見つかったエラーメッセージ
 *
 */
export function getFirstValidationErrorMessage<T extends Record<string, string[]>>(
  validationErrors: T,
  fieldOrder: readonly (keyof T)[],
  defaultMessage: string = '入力内容を確認してください',
): string {
  for (const field of fieldOrder) {
    const errors = validationErrors[field]
    if (errors && errors.length > 0) {
      return errors[0]
    }
  }
  return defaultMessage
}
