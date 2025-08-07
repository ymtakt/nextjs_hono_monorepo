import { describe, expect, it } from 'vitest'
import { ApplicationError, ERROR_CODES, handleServerActionError } from '@/utils/errors'

/**
 * errors.ts のテスト。
 * ApplicationErrorクラスとエラーハンドリング関数を検証する。
 */
describe('errors', () => {
  describe('ApplicationError', () => {
    /**
     * ApplicationErrorが正しく初期化されることを検証する。
     */
    it('ApplicationErrorが正しく初期化される', () => {
      const error = new ApplicationError('TODO_NOT_FOUND')

      expect(error).toBeInstanceOf(ApplicationError)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Todoが見つかりませんでした')
      expect(error.name).toBe('ApplicationError')
    })

    /**
     * 元のエラーオブジェクトが保持されることを検証する。
     */
    it('元のエラーオブジェクトが保持される', () => {
      const originalError = new Error('Original error')
      const error = new ApplicationError('TODO_FETCH_FAILED', originalError)

      expect(error.originalError).toBe(originalError)
      expect(error.message).toBe('Todoの取得に失敗しました')
    })

    /**
     * 異なるエラーコードで正しいメッセージが設定されることを検証する。
     */
    it('異なるエラーコードで正しいメッセージが設定される', () => {
      const networkError = new ApplicationError('NETWORK_ERROR')
      const serverError = new ApplicationError('SERVER_ERROR')
      const createError = new ApplicationError('TODO_CREATE_FAILED')

      expect(networkError.message).toBe('ネットワークエラーが発生しました')
      expect(serverError.message).toBe('サーバーエラーが発生しました')
      expect(createError.message).toBe('Todoの作成に失敗しました')
    })
  })

  describe('handleServerActionError', () => {
    /**
     * ApplicationErrorの場合にメッセージが返されることを検証する。
     */
    it('ApplicationErrorの場合にメッセージが返される', () => {
      const applicationError = new ApplicationError('TODO_NOT_FOUND')
      const result = handleServerActionError(applicationError, 'SERVER_ERROR')

      expect(result).toBe('Todoが見つかりませんでした')
    })

    /**
     * 一般Errorの場合にデフォルトメッセージが返されることを検証する。
     */
    it('一般Errorの場合にデフォルトメッセージが返される', () => {
      const generalError = new Error('Some error')
      const result = handleServerActionError(generalError, 'GENERAL_CREATE_FAILED')

      expect(result).toBe('Todoの作成に失敗しました')
    })

    /**
     * unknownエラーの場合にデフォルトメッセージが返されることを検証する。
     */
    it('unknownエラーの場合にデフォルトメッセージが返される', () => {
      const unknownError = 'string error'
      const result = handleServerActionError(unknownError, 'NETWORK_ERROR')

      expect(result).toBe('ネットワークエラーが発生しました')
    })

    /**
     * nullエラーの場合にデフォルトメッセージが返されることを検証する。
     */
    it('nullエラーの場合にデフォルトメッセージが返される', () => {
      const result = handleServerActionError(null, 'SERVER_ERROR')

      expect(result).toBe('サーバーエラーが発生しました')
    })
  })

  describe('ERROR_CODES', () => {
    /**
     * ERROR_CODESが正しく定義されていることを検証する。
     */
    it('ERROR_CODESが正しく定義されている', () => {
      expect(ERROR_CODES.BASE.NETWORK_ERROR).toBe('NETWORK_ERROR')
      expect(ERROR_CODES.BASE.SERVER_ERROR).toBe('SERVER_ERROR')
      expect(ERROR_CODES.API_TODO.NOT_FOUND).toBe('TODO_NOT_FOUND')
      expect(ERROR_CODES.API_TODO.FETCH_FAILED).toBe('TODO_FETCH_FAILED')
      expect(ERROR_CODES.ACTION_TODO.ID_NOT_FOUND).toBe('TODO_ID_NOT_FOUND')
      expect(ERROR_CODES.ACTION_TODO.GENERAL_CREATE_FAILED).toBe('GENERAL_CREATE_FAILED')
    })
  })
})
