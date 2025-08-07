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
