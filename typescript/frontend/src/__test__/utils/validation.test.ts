import { describe, expect, it } from 'vitest'
import { ACTION_STATUS } from '@/utils/actions'
import {
  FORM_VALIDATION_ERROR_CODES,
  FORM_VALIDATION_ERROR_MESSAGES,
  getFormValidationErrorMessage,
  validationErrorState,
} from '@/utils/validation'

/**
 * validation.ts のテスト。
 * バリデーション関連のユーティリティ関数を検証する。
 */
describe('validation', () => {
  describe('FORM_VALIDATION_ERROR_CODES', () => {
    /**
     * エラーコードが正しく定義されていることを検証する。
     */
    it('エラーコードが正しく定義されている', () => {
      expect(FORM_VALIDATION_ERROR_CODES.REQUIRED_TITLE).toBe('REQUIRED_TITLE')
      expect(FORM_VALIDATION_ERROR_CODES.TITLE_TOO_LONG).toBe('TITLE_TOO_LONG')
      expect(FORM_VALIDATION_ERROR_CODES.REQUIRED_DESCRIPTION).toBe('REQUIRED_DESCRIPTION')
    })
  })

  describe('FORM_VALIDATION_ERROR_MESSAGES', () => {
    /**
     * エラーメッセージが正しく定義されていることを検証する。
     */
    it('エラーメッセージが正しく定義されている', () => {
      expect(FORM_VALIDATION_ERROR_MESSAGES.REQUIRED_TITLE).toBe('タイトルは必須です')
      expect(FORM_VALIDATION_ERROR_MESSAGES.TITLE_TOO_LONG).toBe(
        'タイトルは100文字以内で入力してください',
      )
      expect(FORM_VALIDATION_ERROR_MESSAGES.REQUIRED_DESCRIPTION).toBe('説明を入力してください')
    })
  })

  describe('getFormValidationErrorMessage', () => {
    /**
     * 正しいエラーコードでメッセージが取得できることを検証する。
     */
    it('正しいエラーコードでメッセージが取得できる', () => {
      const titleMessage = getFormValidationErrorMessage('REQUIRED_TITLE')
      const lengthMessage = getFormValidationErrorMessage('TITLE_TOO_LONG')
      const descMessage = getFormValidationErrorMessage('REQUIRED_DESCRIPTION')

      expect(titleMessage).toBe('タイトルは必須です')
      expect(lengthMessage).toBe('タイトルは100文字以内で入力してください')
      expect(descMessage).toBe('説明を入力してください')
    })

    /**
     * 存在しないエラーコードでデフォルトメッセージが返されることを検証する。
     */
    it('存在しないエラーコードでデフォルトメッセージが返される', () => {
      const result = getFormValidationErrorMessage('UNKNOWN_ERROR' as any)

      expect(result).toBe('エラーが発生しました')
    })
  })

  describe('validationErrorState', () => {
    /**
     * 単一フィールドエラーで正しい状態が作成されることを検証する。
     */
    it('単一フィールドエラーで正しい状態が作成される', () => {
      const fieldErrors = {
        title: ['REQUIRED_TITLE'],
        description: undefined,
      }
      const formData = {
        title: '',
        description: 'テスト説明',
      }

      const result = validationErrorState(fieldErrors, formData)

      expect(result).toEqual({
        title: '',
        description: 'テスト説明',
        status: ACTION_STATUS.VALIDATION_ERROR,
        error: 'タイトルは必須です',
        validationErrors: {
          title: ['REQUIRED_TITLE'],
        },
      })
    })

    /**
     * 複数フィールドエラーで最初のエラーメッセージが使用されることを検証する。
     */
    it('複数フィールドエラーで最初のエラーメッセージが使用される', () => {
      const fieldErrors = {
        title: ['REQUIRED_TITLE', 'TITLE_TOO_LONG'],
        description: ['REQUIRED_DESCRIPTION'],
      }
      const formData = {
        title: '',
        description: '',
      }

      const result = validationErrorState(fieldErrors, formData)

      expect(result.error).toBe('タイトルは必須です')
      expect(result.validationErrors).toEqual({
        title: ['REQUIRED_TITLE', 'TITLE_TOO_LONG'],
        description: ['REQUIRED_DESCRIPTION'],
      })
    })

    /**
     * エラーが存在しないフィールドが除外されることを検証する。
     */
    it('エラーが存在しないフィールドが除外される', () => {
      const fieldErrors = {
        title: ['REQUIRED_TITLE'],
        description: undefined,
        completed: [],
      }
      const formData = {
        title: '',
        description: 'テスト説明',
        completed: false,
      }

      const result = validationErrorState(fieldErrors, formData)

      expect(result.validationErrors).toEqual({
        title: ['REQUIRED_TITLE'],
      })
      expect(result.validationErrors).not.toHaveProperty('description')
      expect(result.validationErrors).not.toHaveProperty('completed')
    })

    /**
     * エラーが存在しない場合にデフォルトメッセージが使用されることを検証する。
     */
    it('エラーが存在しない場合にデフォルトメッセージが使用される', () => {
      const fieldErrors = {}
      const formData = {
        title: 'テストタイトル',
        description: 'テスト説明',
      }

      const result = validationErrorState(fieldErrors, formData)

      expect(result.error).toBe('入力内容を確認してください')
      expect(result.validationErrors).toEqual({})
    })

    /**
     * フォームデータが正しく保持されることを検証する。
     */
    it('フォームデータが正しく保持される', () => {
      const fieldErrors = {
        title: ['REQUIRED_TITLE'],
      }
      const formData = {
        title: 'ユーザー入力値',
        description: 'ユーザー説明',
        completed: true,
      }

      const result = validationErrorState(fieldErrors, formData)

      expect(result.title).toBe('ユーザー入力値')
      expect(result.description).toBe('ユーザー説明')
      expect(result.completed).toBe(true)
    })
  })
})
