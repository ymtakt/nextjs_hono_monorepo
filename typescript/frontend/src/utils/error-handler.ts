import { ApiError, ApplicationError } from './errors'

/**
 * 外部APIエラーをアプリケーション内エラーに変換する関数。
 * HTTPステータスコードやエラータイプに応じて適切なメッセージを生成する。
 *
 * @param error - 変換対象のエラーオブジェクト
 * @returns アプリケーション内で統一されたApplicationErrorインスタンス
 *
 * @example
 * ```typescript
 * const apiError = new ApiError(404, "Not Found");
 * const appError = transformApiError(apiError); // "データが見つかりません"
 * ```
 */
export function transformApiError(error: unknown): ApplicationError {
  // API エラーの場合、ステータスコードに基づいて変換
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return new ApplicationError('入力内容に問題があります', 'INVALID_INPUT', error)
      case 401:
        return new ApplicationError('認証が必要です', 'UNAUTHORIZED', error)
      case 403:
        return new ApplicationError('この操作を行う権限がありません', 'FORBIDDEN', error)
      case 404:
        return new ApplicationError('データが見つかりません', 'NOT_FOUND', error)
      case 409:
        return new ApplicationError('データが競合しています', 'CONFLICT', error)
      case 500:
        return new ApplicationError('サーバーエラーが発生しました', 'SERVER_ERROR', error)
      default:
        // 未定義のステータスコードの場合
        return new ApplicationError('通信エラーが発生しました', 'API_ERROR', error)
    }
  }

  // ネットワークエラーの場合（fetch APIの失敗など）
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new ApplicationError('ネットワークに接続できません', 'NETWORK_ERROR', error)
  }

  // その他の一般的なErrorオブジェクトの場合
  if (error instanceof Error) {
    return new ApplicationError('予期しないエラーが発生しました', 'UNKNOWN_ERROR', error)
  }

  // 完全に未知のエラータイプの場合
  return new ApplicationError('不明なエラーが発生しました', 'UNKNOWN_ERROR', error)
}

/**
 * エラーオブジェクトからユーザー向けメッセージを取得する関数。
 * ApplicationErrorの場合は直接メッセージを返し、それ以外は変換処理を行う。
 *
 * @param error - メッセージ取得対象のエラーオブジェクト
 * @returns ユーザーに表示すべきエラーメッセージ文字列
 *
 * @example
 * ```typescript
 * const message = getErrorMessage(new ApiError(500, "Internal Error"));
 * console.log(message); // "サーバーエラーが発生しました"
 * ```
 */
export function getErrorMessage(error: unknown): string {
  // すでにApplicationErrorの場合は直接メッセージを返す
  if (error instanceof ApplicationError) {
    return error.message
  }

  // その他のエラーは変換処理を経てメッセージを取得
  const appError = transformApiError(error)
  return appError.message
}
