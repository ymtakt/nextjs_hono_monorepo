import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'
import type { ActionState } from '@/util/server-actions'
import {
  ACTION_STATUS,
  convertValidationErrors,
  extractZodErrorMessage,
  getFirstValidationErrorMessage,
  withServerActionHandling,
} from '@/util/server-actions'

// useToastを完全にモック化
const mockSuccess = vi.fn()
const mockError = vi.fn()

vi.mock('@/util/hook/useToast', () => ({
  useToast: vi.fn(() => ({
    success: mockSuccess,
    error: mockError,
  })),
}))

describe('withServerActionHandling', () => {
  const mockOnSuccess = vi.fn()

  const initialState: ActionState = {
    status: ACTION_STATUS.IDLE,
    error: null,
    validationErrors: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 前提：Server Actionが成功ステータスを返す
  // 期待値：onSuccessコールバックが呼ばれ、初期状態が返される
  it('成功時にコールバックが実行され初期状態が返される', async () => {
    const mockServerAction = vi.fn().mockResolvedValue({
      status: ACTION_STATUS.SUCCESS,
      error: null,
      validationErrors: null,
    })

    const wrappedAction = withServerActionHandling(mockServerAction, {
      onSuccess: mockOnSuccess,
      initialState,
    })

    const formData = new FormData()
    const result = await wrappedAction(initialState, formData)

    expect(mockOnSuccess).toHaveBeenCalledWith({ success: mockSuccess })
    expect(result).toEqual(initialState)
  })

  // 前提：Server Actionがバリデーションエラーステータスを返す
  // 期待値：エラートーストが表示され、エラー状態が返される
  it('バリデーションエラー時にエラートーストが表示される', async () => {
    const errorState = {
      status: ACTION_STATUS.VALIDATION_ERROR,
      error: 'バリデーションエラーが発生しました',
      validationErrors: { title: ['タイトルは必須です'] },
    }

    const mockServerAction = vi.fn().mockResolvedValue(errorState)

    const wrappedAction = withServerActionHandling(mockServerAction, {
      onSuccess: mockOnSuccess,
      initialState,
    })

    const formData = new FormData()
    const result = await wrappedAction(initialState, formData)

    expect(mockError).toHaveBeenCalledWith('バリデーションエラーが発生しました')
    expect(result).toEqual(errorState)
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  // 前提：Server Actionがサーバーエラーステータスを返す
  // 期待値：エラートーストが表示され、エラー状態が返される
  it('サーバーエラー時にエラートーストが表示される', async () => {
    const errorState = {
      status: ACTION_STATUS.SERVER_ERROR,
      error: 'サーバーエラーが発生しました',
      validationErrors: null,
    }

    const mockServerAction = vi.fn().mockResolvedValue(errorState)

    const wrappedAction = withServerActionHandling(mockServerAction, {
      onSuccess: mockOnSuccess,
      initialState,
    })

    const formData = new FormData()
    const result = await wrappedAction(initialState, formData)

    expect(mockError).toHaveBeenCalledWith('サーバーエラーが発生しました')
    expect(result).toEqual(errorState)
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  // 前提：Server Actionが予期しないステータスを返す
  // 期待値：そのまま結果が返され、トーストやコールバックは実行されない
  it('予期しないステータス時は結果をそのまま返す', async () => {
    const unknownState = {
      status: 'unknown_status' as any,
      error: null,
      validationErrors: null,
    }

    const mockServerAction = vi.fn().mockResolvedValue(unknownState)

    const wrappedAction = withServerActionHandling(mockServerAction, {
      onSuccess: mockOnSuccess,
      initialState,
    })

    const formData = new FormData()
    const result = await wrappedAction(initialState, formData)

    expect(result).toEqual(unknownState)
    expect(mockError).not.toHaveBeenCalled()
    expect(mockSuccess).not.toHaveBeenCalled()
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })
})
describe('extractZodErrorMessage関数のテスト', () => {
  // 前提：複数フィールドにエラーがあるZodErrorが渡される
  // 期待値：最初のエラーメッセージが返される
  it('複数フィールドにエラーがあるZodErrorが渡される', () => {
    const error = new ZodError([
      {
        code: 'custom',
        message: 'titleエラーが発生しました',
        path: ['title'],
      },
      {
        code: 'custom',
        message: 'descriptionエラーが発生しました',
        path: ['description'],
      },
    ])
    expect(extractZodErrorMessage(error)).toBe('titleエラーが発生しました')
  })

  // 前提：エラーメッセージが空のZodErrorが渡される
  // 期待値：デフォルトメッセージ「バリデーションエラー」が返される
  it('エラーメッセージが空のZodErrorが渡される', () => {
    const error = new ZodError([])
    expect(extractZodErrorMessage(error)).toBe('バリデーションエラー')
  })

  // 前提：複数のエラーメッセージがある単一フィールドのZodErrorが渡される
  // 期待値：最初のエラーメッセージが返される
  it('複数のエラーメッセージがある単一フィールドのZodErrorが渡される', () => {
    const error = new ZodError([
      {
        code: 'custom',
        message: '最初のエラー',
        path: ['title'],
      },
      {
        code: 'custom',
        message: '二番目のエラー',
        path: ['title'], // 同じフィールド
      },
    ])
    expect(extractZodErrorMessage(error)).toBe('最初のエラー')
  })
})

describe('convertValidationErrors関数のテスト', () => {
  // 前提：有効なフィールドエラーとメッセージマップが渡される
  // 期待値：エラーコードが表示用メッセージに変換される
  it('有効なフィールドエラーとメッセージマップが渡される', () => {
    const fieldErrors = {
      title: ['REQUIRED_TITLE'],
      description: ['REQUIRED_DESCRIPTION'],
    }
    const messageMap = {
      REQUIRED_TITLE: 'タイトルは必須です',
      REQUIRED_DESCRIPTION: '説明は必須です',
    }
    const validFields = ['title', 'description'] as const
    expect(convertValidationErrors(fieldErrors, messageMap, validFields)).toEqual({
      title: ['タイトルは必須です'],
      description: ['説明は必須です'],
    })
  })

  // 前提：存在しないエラーコードを含むフィールドエラーが渡される
  // 期待値：デフォルトメッセージ「エラーが発生しました」が使用される
  it('存在しないエラーコードを含むフィールドエラーが渡される', () => {
    const fieldErrors = {
      title: ['UNKNOWN_ERROR'], // messageMapに存在しないコード
    }
    const messageMap = {
      REQUIRED_TITLE: 'タイトルは必須です', // UNKNOWN_ERRORは定義されていない
    }
    const validFields = ['title'] as const
    expect(convertValidationErrors(fieldErrors, messageMap, validFields)).toEqual({
      title: ['エラーが発生しました'], // デフォルトメッセージが使用される
    })
  })

  // 前提：空のフィールドエラーが渡される
  // 期待値：空のオブジェクトが返される
  it('空のフィールドエラーが渡される', () => {
    const fieldErrors = {}
    const messageMap = {
      REQUIRED_TITLE: 'タイトルは必須です',
      REQUIRED_DESCRIPTION: '説明は必須です',
    }
    const validFields = ['title', 'description'] as const
    expect(convertValidationErrors(fieldErrors, messageMap, validFields)).toEqual({})
  })
})

describe('getFirstValidationErrorMessage関数のテスト', () => {
  // 前提：複数フィールドにエラーがあり、フィールド順序が指定される
  // 期待値：指定順序で最初のフィールドのエラーメッセージが返される
  it('複数フィールドにエラーがあり、フィールド順序で最初のエラーが返される', () => {
    const validationErrors = {
      title: ['タイトルは必須です'],
      description: ['説明は必須です'],
    }
    const fieldOrder = ['description', 'title'] as const // descriptionを先にチェック

    expect(getFirstValidationErrorMessage(validationErrors, fieldOrder)).toBe('説明は必須です')
  })

  // 前提：エラーがないvalidationErrorsが渡される
  // 期待値：デフォルトメッセージ「入力内容を確認してください」が返される
  it('エラーがない場合デフォルトメッセージが返される', () => {
    const validationErrors = {} as Record<string, string[]>
    const fieldOrder = ['title', 'description'] as const

    expect(getFirstValidationErrorMessage(validationErrors, fieldOrder)).toBe(
      '入力内容を確認してください',
    )
  })

  // 前提：空配列のエラーメッセージを持つフィールドがある
  // 期待値：そのフィールドはスキップされ次のフィールドのエラーメッセージが返される
  it('空配列のフィールドはスキップされる', () => {
    const validationErrors = {
      title: [], // 空配列
      description: ['説明は必須です'],
    }
    const fieldOrder = ['title', 'description'] as const

    expect(getFirstValidationErrorMessage(validationErrors, fieldOrder)).toBe('説明は必須です')
  })
})
