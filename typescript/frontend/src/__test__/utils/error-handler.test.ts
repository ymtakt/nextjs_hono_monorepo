import { describe, expect, it } from 'vitest'
import { getErrorMessage, transformApiError } from '@/utils/error-handler'
import { ApiError, ApplicationError } from '@/utils/errors'

/**
 * errorHandler関数群のテスト。
 * エラーの変換処理とメッセージ取得を検証する。
 */
describe('errorHandler', () => {
  describe('transformApiError', () => {
    /**
     * 400エラーが正しく変換されることを検証する。
     */
    it('400エラーが正しく変換される', () => {
      const apiError = new ApiError(400, 'Bad Request')
      const result = transformApiError(apiError)

      expect(result).toBeInstanceOf(ApplicationError)
      expect(result.message).toBe('入力内容に問題があります')
      expect(result.code).toBe('INVALID_INPUT')
      expect(result.originalError).toBe(apiError)
    })

    /**
     * 401エラーが正しく変換されることを検証する。
     */
    it('401エラーが正しく変換される', () => {
      const apiError = new ApiError(401, 'Unauthorized')
      const result = transformApiError(apiError)

      expect(result.message).toBe('認証が必要です')
      expect(result.code).toBe('UNAUTHORIZED')
    })

    /**
     * 403エラーが正しく変換されることを検証する。
     */
    it('403エラーが正しく変換される', () => {
      const apiError = new ApiError(403, 'Forbidden')
      const result = transformApiError(apiError)

      expect(result.message).toBe('この操作を行う権限がありません')
      expect(result.code).toBe('FORBIDDEN')
    })

    /**
     * 404エラーが正しく変換されることを検証する。
     */
    it('404エラーが正しく変換される', () => {
      const apiError = new ApiError(404, 'Not Found')
      const result = transformApiError(apiError)

      expect(result.message).toBe('データが見つかりません')
      expect(result.code).toBe('NOT_FOUND')
    })

    /**
     * 409エラーが正しく変換されることを検証する。
     */
    it('409エラーが正しく変換される', () => {
      const apiError = new ApiError(409, 'Conflict')
      const result = transformApiError(apiError)

      expect(result.message).toBe('データが競合しています')
      expect(result.code).toBe('CONFLICT')
    })

    /**
     * 500エラーが正しく変換されることを検証する。
     */
    it('500エラーが正しく変換される', () => {
      const apiError = new ApiError(500, 'Internal Server Error')
      const result = transformApiError(apiError)

      expect(result.message).toBe('サーバーエラーが発生しました')
      expect(result.code).toBe('SERVER_ERROR')
    })

    /**
     * 未定義のステータスコードが正しく変換されることを検証する。
     */
    it('未定義のステータスコードが正しく変換される', () => {
      const apiError = new ApiError(418, "I'm a teapot")
      const result = transformApiError(apiError)

      expect(result.message).toBe('通信エラーが発生しました')
      expect(result.code).toBe('API_ERROR')
    })

    /**
     * ネットワークエラーが正しく変換されることを検証する。
     */
    it('ネットワークエラーが正しく変換される', () => {
      const networkError = new TypeError('fetch failed')
      const result = transformApiError(networkError)

      expect(result.message).toBe('ネットワークに接続できません')
      expect(result.code).toBe('NETWORK_ERROR')
    })

    /**
     * 一般的なErrorが正しく変換されることを検証する。
     */
    it('一般的なErrorが正しく変換される', () => {
      const genericError = new Error('何かがおかしい')
      const result = transformApiError(genericError)

      expect(result.message).toBe('予期しないエラーが発生しました')
      expect(result.code).toBe('UNKNOWN_ERROR')
    })

    /**
     * 未知のエラータイプが正しく変換されることを検証する。
     */
    it('未知のエラータイプが正しく変換される', () => {
      const unknownError = '文字列エラー'
      const result = transformApiError(unknownError)

      expect(result.message).toBe('不明なエラーが発生しました')
      expect(result.code).toBe('UNKNOWN_ERROR')
    })
  })

  describe('getErrorMessage', () => {
    /**
     * ApplicationErrorからメッセージを取得できることを検証する。
     */
    it('ApplicationErrorからメッセージを取得できる', () => {
      const appError = new ApplicationError('アプリケーションエラー', 'APP_ERROR')
      const result = getErrorMessage(appError)

      expect(result).toBe('アプリケーションエラー')
    })

    /**
     * ApiErrorが変換されてメッセージを取得できることを検証する。
     */
    it('ApiErrorが変換されてメッセージを取得できる', () => {
      const apiError = new ApiError(404, 'Not Found')
      const result = getErrorMessage(apiError)

      expect(result).toBe('データが見つかりません')
    })

    /**
     * 未知のエラーが変換されてメッセージを取得できることを検証する。
     */
    it('未知のエラーが変換されてメッセージを取得できる', () => {
      const unknownError = { message: '不明なオブジェクト' }
      const result = getErrorMessage(unknownError)

      expect(result).toBe('不明なエラーが発生しました')
    })
  })
})
