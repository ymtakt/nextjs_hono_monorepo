import type { ZodError } from 'zod'

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
 * Zodエラーから最初のエラーメッセージを抽出
 *
 * zodのバリデーションエラーから全フィールドのエラーメッセージを収集し、
 * 最初に見つかったエラーメッセージを返す
 *
 * 主にクライアントサイドでの簡単なエラー表示に使用される
 *
 * @template T - zodスキーマの型
 * @param error - zodのバリデーションエラーオブジェクト
 * @returns 最初のエラーメッセージ（エラーがない場合はデフォルトメッセージ）
 *
 * @example
 * ```typescript
 * const result = schema.safeParse(data)
 * if (!result.success) {
 *   const errorMessage = extractZodErrorMessage(result.error)
 *   console.log(errorMessage) // 例: "REQUIRED_TITLE"
 * }
 * ```
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
 * @example
 * ```typescript
 * const fieldErrors = { title: ['REQUIRED_TITLE'], description: ['REQUIRED_DESCRIPTION'] }
 * const messageMap = { REQUIRED_TITLE: 'タイトルは必須です', REQUIRED_DESCRIPTION: '説明は必須です' }
 * const validFields = ['title', 'description', 'completed'] as const
 *
 * const converted = convertValidationErrors<TodoValidationErrors>(
 *   fieldErrors, messageMap, validFields
 * )
 * // 結果: { title: ['タイトルは必須です'], description: ['説明は必須です'] }
 * ```
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
 * @example
 * ```typescript
 * const validationErrors = {
 *   title: ['タイトルは必須です'],
 *   description: ['説明は必須です']
 * }
 * const fieldOrder = ['title', 'description', 'completed'] as const
 *
 * const firstError = getFirstValidationErrorMessage(validationErrors, fieldOrder)
 * // 結果: 'タイトルは必須です' (titleが最初の順序のため)
 * ```
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

/**
 * バリデーションエラー状態を作成するユーティリティ関数
 *
 * zodのバリデーションエラーをuseActionStateで使用できる統一された
 * ActionState形式に変換する汎用関数
 *
 * 注意：この関数はエラーメッセージの変換は行わず、識別子をそのまま保持する
 * エラーメッセージの変換は各Server Actionで行う設計
 *
 * @template T - フォームのフィールド型（例：TodoFormFields）
 * @template U - ActionState型（例：TodoFormActionState）
 *
 * @param fieldErrors - zodのerror.flatten().fieldErrorsから取得したフィールドエラー
 *                      形式：{ fieldName: string[] | undefined }
 * @param formData - ユーザーが入力したフォームデータ（エラー時に値を保持するため）
 *
 * @returns バリデーションエラー状態のActionState
 *          - status: VALIDATION_ERROR
 *          - error: 固定メッセージ
 *          - validationErrors: エラーがあるフィールドのみを含むオブジェクト
 *          - ...formData: ユーザー入力値を保持
 *
 * @example
 * ```typescript
 * const fieldErrors = { title: ['REQUIRED_TITLE'], description: undefined }
 * const formData = { title: '', description: 'test' }
 *
 * const errorState = validationErrorState(fieldErrors, formData)
 * // 結果: {
 * //   title: '',
 * //   description: 'test',
 * //   status: 'validation_error',
 * //   error: '入力内容を確認してください',
 * //   validationErrors: { title: ['REQUIRED_TITLE'] }
 * // }
 * ```
 */
export function validationErrorState<
  T extends Record<string, unknown>,
  U extends ActionState<T, Record<string, string[]>>,
>(fieldErrors: Record<string, string[] | undefined>, formData: T): U {
  const validationErrors: Record<string, string[]> = {}

  for (const [key, errors] of Object.entries(fieldErrors)) {
    if (Array.isArray(errors) && errors.length > 0) {
      validationErrors[key] = errors
    }
  }

  return {
    ...formData,
    status: ACTION_STATUS.VALIDATION_ERROR,
    error: '入力内容を確認してください',
    validationErrors,
  } as U
}
