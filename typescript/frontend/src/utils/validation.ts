// // zodバリデーションのエラーテキストはあくまでも識別子である
// // アプリ内で表示する文字をここでは管理しない
// // ↓　Form Page Button Tapなどの命名や「１０文字以内です」
// // fetch create error validation todoなどの概念そのものとか などの命名はロジックに出てくる
// //
// // その上で直接日本語にするのであればそのようなルールを明記する
// export type TodoTitleValidationError = 'REQUIRED_TITLE' | 'TITLE_TOO_LONG'

import { ACTION_STATUS, type ActionState } from '@/utils/actions'

// バリデーションエラーの識別子を定義
export const FORM_VALIDATION_ERROR_CODES = {
  REQUIRED_TITLE: 'REQUIRED_TITLE',
  TITLE_TOO_LONG: 'TITLE_TOO_LONG',
  REQUIRED_DESCRIPTION: 'REQUIRED_DESCRIPTION',
} as const

export type FormValidationErrorCode =
  (typeof FORM_VALIDATION_ERROR_CODES)[keyof typeof FORM_VALIDATION_ERROR_CODES]

// バリデーションエラーのメッセージを定義
export const FORM_VALIDATION_ERROR_MESSAGES: Record<FormValidationErrorCode, string> = {
  REQUIRED_TITLE: 'タイトルは必須です',
  TITLE_TOO_LONG: 'タイトルは100文字以内で入力してください',
  REQUIRED_DESCRIPTION: '説明を入力してください',
}

// バリデーションエラーの識別子からメッセージを取得する関数

/**
 * バリデーションエラーの識別子からメッセージを取得する
 *
 * エラーコードから人間が読めるメッセージに変換：
 * 例：'REQUIRED_TITLE' → 'タイトルは必須です'
 */
export function getFormValidationErrorMessage(errorCode: FormValidationErrorCode): string {
  return FORM_VALIDATION_ERROR_MESSAGES[errorCode] || 'エラーが発生しました'
}

/**
 * バリデーションエラー状態を作成するユーティリティ関数
 *
 * zodのバリデーションエラーを受け取り、useActionStateで使用できる
 * 統一されたActionState形式に変換する
 *
 * @template T - フォームのフィールド型（例：{ title?: string, description?: string }）
 * @template U - ActionState型（例：TodoFormActionState）
 *
 * @param fieldErrors - zodのerror.flatten().fieldErrorsから取得したフィールドエラー
 *                      形式：{ fieldName: string[] | undefined }
 * @param formData - ユーザーが入力したフォームデータ（エラー時に値を保持するため）
 *
 * @returns U - バリデーションエラー状態のActionState
 *
 */
export function validationErrorState<
  T extends Record<string, unknown>,
  U extends ActionState<T, Record<string, string[]>>,
>(fieldErrors: Record<string, string[] | undefined>, formData: T): U {
  /**
   * 全フィールドのエラーメッセージを1つの配列に統合
   *
   * zodから返されるfieldErrorsは以下のような構造：
   * {
   *   title: ['REQUIRED_TITLE', 'TITLE_TOO_LONG'],
   *   description: ['REQUIRED_DESCRIPTION'],
   *   completed: undefined
   * }
   *
   * これを['REQUIRED_TITLE', 'TITLE_TOO_LONG', 'REQUIRED_DESCRIPTION']
   * のような単一配列に変換する
   */
  const allErrors: string[] = []
  for (const errors of Object.values(fieldErrors)) {
    if (Array.isArray(errors)) {
      allErrors.push(...errors)
    }
  }

  /**
   * 最初の1つ目のエラーを取得してユーザー表示用メッセージに変換
   */
  const firstErrorMessage =
    allErrors.length > 0
      ? getFormValidationErrorMessage(allErrors[0] as FormValidationErrorCode)
      : '入力内容を確認してください'

  /**
   * validationErrorsオブジェクトを構築
   *
   * エラーが存在するフィールドのみvalidationErrorsに含める
   *
   */
  const validationErrors: Record<string, string[]> = {}
  for (const [key, errors] of Object.entries(fieldErrors)) {
    // エラーが存在し、かつ配列が空でない場合のみ追加
    if (Array.isArray(errors) && errors.length > 0) {
      validationErrors[key] = errors
    }
  }

  /**
   * 最終的なActionStateオブジェクトを構築して返す
   *
   * 構築されるオブジェクトの例：
   * {
   *   // formDataから（ユーザー入力値を保持）
   *
   *   // バリデーションエラー状態
   *   status: 'validation_error',
   *   error: 'タイトルは必須です',
   *   validationErrors: {
   *     title: ['REQUIRED_TITLE'],　エラーがあるもののみ
   *   }
   * }
   */
  return {
    ...formData,
    status: ACTION_STATUS.VALIDATION_ERROR,
    error: firstErrorMessage,
    validationErrors,
  } as U
}
