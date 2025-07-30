/**
 * アプリケーション内で使用する統一エラークラス。
 * 外部APIエラーを変換した後の、ユーザー向けメッセージを持つエラー。
 */
export class ApplicationError extends Error {
  /**
   * ApplicationErrorのコンストラクタ。
   *
   * @param message - ユーザーに表示するエラーメッセージ
   * @param code - エラーコード（オプション）
   * @param originalError - 元のエラーオブジェクト（オプション）
   */
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: unknown,
  ) {
    super(message)
    this.name = 'ApplicationError'
  }
}

/**
 * API通信で発生するエラーを表現するクラス。
 * HTTPステータスコードと詳細メッセージを保持する。
 */
export class ApiError extends Error {
  /**
   * ApiErrorのコンストラクタ。
   *
   * @param status - HTTPステータスコード
   * @param message - APIから返されたエラーメッセージ
   * @param originalError - 元のエラーオブジェクト（オプション）
   */
  constructor(
    public readonly status: number,
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
