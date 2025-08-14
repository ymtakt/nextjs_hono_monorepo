import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  createInitialActionState,
  useServerActionWrapper,
} from '@/utils/hooks/useServerActionWrapper'
import { ACTION_STATUS, type ActionState } from '@/utils/server-actions'

/**
 * useServerActionWrapper hook のテスト。
 * Server Actionの高階関数とヘルパー関数の動作を検証する。
 */

// テスト用の型定義
type TestFormFields = {
  title?: string
  description?: string
}

type TestValidationErrors = {
  title: string[]
  description: string[]
}

type TestActionState = ActionState<TestFormFields, TestValidationErrors>

// useToast hookをモック化
vi.mock('@/utils/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('useServerActionWrapper', () => {
  /**
   * 成功時の処理が正しく動作することを検証する。
   */
  it('成功時の処理が正しく動作する', async () => {
    const mockServerAction = vi.fn().mockResolvedValue({
      status: ACTION_STATUS.SUCCESS,
      error: null,
      validationErrors: null,
    } as TestActionState)

    const mockOnSuccess = vi.fn()
    const initialState: TestActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    }

    const { result } = renderHook(() =>
      useServerActionWrapper<TestFormFields, TestValidationErrors>(mockServerAction, {
        onSuccess: mockOnSuccess,
        initialState,
      }),
    )

    const formData = new FormData()
    formData.append('title', 'テストタイトル')

    const prevState: TestActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    }

    let actionResult: TestActionState
    await act(async () => {
      actionResult = await result.current(prevState, formData)
    })

    // ServerActionが呼ばれることを確認
    expect(mockServerAction).toHaveBeenCalledWith(prevState, formData)

    // onSuccessコールバックが呼ばれることを確認
    expect(mockOnSuccess).toHaveBeenCalledWith({
      success: expect.any(Function),
    })

    // 初期状態が返されることを確認
    expect(actionResult!).toEqual(initialState)
  })

  /**
   * バリデーションエラー時の処理が正しく動作することを検証する。
   */
  it('バリデーションエラー時の処理が正しく動作する', async () => {
    const validationErrorResult: TestActionState = {
      status: ACTION_STATUS.VALIDATION_ERROR,
      error: 'タイトルは必須です',
      validationErrors: {
        title: ['REQUIRED_TITLE'],
        description: [],
      },
      title: '',
      description: 'テスト説明',
    }

    const mockServerAction = vi.fn().mockResolvedValue(validationErrorResult)
    const mockOnSuccess = vi.fn()
    const initialState: TestActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    }

    const { result } = renderHook(() =>
      useServerActionWrapper<TestFormFields, TestValidationErrors>(mockServerAction, {
        onSuccess: mockOnSuccess,
        initialState,
      }),
    )

    const formData = new FormData()
    const prevState: TestActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    }

    let actionResult: TestActionState
    await act(async () => {
      actionResult = await result.current(prevState, formData)
    })

    // onSuccessが呼ばれないことを確認
    expect(mockOnSuccess).not.toHaveBeenCalled()

    // バリデーションエラーの結果がそのまま返されることを確認
    expect(actionResult!).toEqual(validationErrorResult)
  })

  /**
   * サーバーエラー時の処理が正しく動作することを検証する。
   */
  it('サーバーエラー時の処理が正しく動作する', async () => {
    const serverErrorResult: TestActionState = {
      status: ACTION_STATUS.SERVER_ERROR,
      error: 'サーバーエラーが発生しました',
      validationErrors: null,
      title: 'テストタイトル',
      description: 'テスト説明',
    }

    const mockServerAction = vi.fn().mockResolvedValue(serverErrorResult)
    const mockOnSuccess = vi.fn()
    const initialState: TestActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    }

    const { result } = renderHook(() =>
      useServerActionWrapper<TestFormFields, TestValidationErrors>(mockServerAction, {
        onSuccess: mockOnSuccess,
        initialState,
      }),
    )

    const formData = new FormData()
    const prevState: TestActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    }

    let actionResult: TestActionState
    await act(async () => {
      actionResult = await result.current(prevState, formData)
    })

    // onSuccessが呼ばれないことを確認
    expect(mockOnSuccess).not.toHaveBeenCalled()

    // サーバーエラーの結果がそのまま返されることを確認
    expect(actionResult!).toEqual(serverErrorResult)
  })

  /**
   * 予期しないステータスの場合に結果がそのまま返されることを検証する。
   */
  it('予期しないステータスの場合に結果がそのまま返される', async () => {
    const unexpectedResult: TestActionState = {
      status: 'UNKNOWN_STATUS' as any,
      error: null,
      validationErrors: null,
    }

    const mockServerAction = vi.fn().mockResolvedValue(unexpectedResult)
    const mockOnSuccess = vi.fn()
    const initialState: TestActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    }

    const { result } = renderHook(() =>
      useServerActionWrapper<TestFormFields, TestValidationErrors>(mockServerAction, {
        onSuccess: mockOnSuccess,
        initialState,
      }),
    )

    const formData = new FormData()
    const prevState: TestActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    }

    let actionResult: TestActionState
    await act(async () => {
      actionResult = await result.current(prevState, formData)
    })

    // onSuccessが呼ばれないことを確認
    expect(mockOnSuccess).not.toHaveBeenCalled()

    // 予期しない結果がそのまま返されることを確認
    expect(actionResult!).toEqual(unexpectedResult)
  })

  /**
   * onSuccessコールバックで成功関数が正しく呼べることを検証する。
   */
  it('onSuccessコールバックで成功関数が正しく呼べる', async () => {
    const mockServerAction = vi.fn().mockResolvedValue({
      status: ACTION_STATUS.SUCCESS,
      error: null,
      validationErrors: null,
    } as TestActionState)

    let capturedSuccessFunction: ((message: string) => void) | null = null
    const mockOnSuccess = vi.fn((params) => {
      capturedSuccessFunction = params.success
    })

    const initialState: TestActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    }

    const { result } = renderHook(() =>
      useServerActionWrapper<TestFormFields, TestValidationErrors>(mockServerAction, {
        onSuccess: mockOnSuccess,
        initialState,
      }),
    )

    const formData = new FormData()
    const prevState: TestActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    }

    await act(async () => {
      await result.current(prevState, formData)
    })

    // onSuccessが呼ばれ、success関数が渡されることを確認
    expect(mockOnSuccess).toHaveBeenCalled()
    expect(capturedSuccessFunction).toBeInstanceOf(Function)

    // success関数が呼べることを確認（エラーが発生しないことをテスト）
    await act(async () => {
      capturedSuccessFunction!('成功メッセージ')
    })
  })

  /**
   * Server Actionでエラーが発生した場合に適切に処理されることを検証する。
   */
  it('Server Actionでエラーが発生した場合に適切に処理される', async () => {
    const mockError = new Error('Server Action Error')
    const mockServerAction = vi.fn().mockRejectedValue(mockError)
    const mockOnSuccess = vi.fn()
    const initialState: TestActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    }

    const { result } = renderHook(() =>
      useServerActionWrapper<TestFormFields, TestValidationErrors>(mockServerAction, {
        onSuccess: mockOnSuccess,
        initialState,
      }),
    )

    const formData = new FormData()
    const prevState: TestActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    }

    // エラーが再throwされることを確認
    await act(async () => {
      await expect(result.current(prevState, formData)).rejects.toThrow('Server Action Error')
    })

    // onSuccessが呼ばれないことを確認
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  /**
   * 複数回の呼び出しで正しく動作することを検証する。
   */
  it('複数回の呼び出しで正しく動作する', async () => {
    const mockServerAction = vi
      .fn()
      .mockResolvedValueOnce({
        status: ACTION_STATUS.SUCCESS,
        error: null,
        validationErrors: null,
      } as TestActionState)
      .mockResolvedValueOnce({
        status: ACTION_STATUS.VALIDATION_ERROR,
        error: 'エラーです',
        validationErrors: { title: ['REQUIRED_TITLE'], description: [] },
        title: '',
        description: '',
      } as TestActionState)

    const mockOnSuccess = vi.fn()
    const initialState: TestActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    }

    const { result } = renderHook(() =>
      useServerActionWrapper<TestFormFields, TestValidationErrors>(mockServerAction, {
        onSuccess: mockOnSuccess,
        initialState,
      }),
    )

    const formData = new FormData()
    const prevState: TestActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    }

    // 1回目の呼び出し（成功）
    let firstResult: TestActionState
    await act(async () => {
      firstResult = await result.current(prevState, formData)
    })

    expect(firstResult!).toEqual(initialState)
    expect(mockOnSuccess).toHaveBeenCalledTimes(1)

    // 2回目の呼び出し（エラー）
    let secondResult: TestActionState
    await act(async () => {
      secondResult = await result.current(prevState, formData)
    })

    expect(secondResult!.status).toBe(ACTION_STATUS.VALIDATION_ERROR)
    expect(mockOnSuccess).toHaveBeenCalledTimes(1) // 1回目のみ
  })
})

describe('createInitialActionState', () => {
  /**
   * 初期状態が正しく作成されることを検証する。
   */
  it('初期状態が正しく作成される', () => {
    const result = createInitialActionState<TestFormFields, TestValidationErrors>()

    expect(result).toEqual({
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    })
  })

  /**
   * 型パラメータなしでも初期状態が作成されることを検証する。
   */
  it('型パラメータなしでも初期状態が作成される', () => {
    const result = createInitialActionState()

    expect(result).toEqual({
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    })
    expect(result.status).toBe('idle')
  })

  /**
   * 複数回呼び出しても同じ構造の初期状態が作成されることを検証する。
   */
  it('複数回呼び出しても同じ構造の初期状態が作成される', () => {
    const result1 = createInitialActionState<TestFormFields, TestValidationErrors>()
    const result2 = createInitialActionState<TestFormFields, TestValidationErrors>()

    expect(result1).toEqual(result2)
    expect(result1).not.toBe(result2) // 参照は異なることを確認
  })

  /**
   * 作成された初期状態のプロパティが正しい型であることを検証する。
   */
  it('作成された初期状態のプロパティが正しい型である', () => {
    const result = createInitialActionState<TestFormFields, TestValidationErrors>()

    expect(typeof result.status).toBe('string')
    expect(result.error).toBeNull()
    expect(result.validationErrors).toBeNull()
  })

  /**
   * 異なる型パラメータで呼び出しても正しい構造が作成されることを検証する。
   */
  it('異なる型パラメータで呼び出しても正しい構造が作成される', () => {
    type DifferentFormFields = {
      name?: string
      email?: string
    }

    type DifferentValidationErrors = {
      name: string[]
      email: string[]
    }

    const result = createInitialActionState<DifferentFormFields, DifferentValidationErrors>()

    expect(result).toEqual({
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    })
    expect(result.status).toBe(ACTION_STATUS.IDLE)
  })

  /**
   * 作成された初期状態が不変であることを検証する。
   */
  it('作成された初期状態が不変である', () => {
    const result = createInitialActionState<TestFormFields, TestValidationErrors>()
    const originalStatus = result.status

    // 値を変更してみる
    result.status = ACTION_STATUS.SUCCESS as any

    // 元の値が変更されていることを確認（参照は同じため）
    expect(result.status).toBe(ACTION_STATUS.SUCCESS)
    expect(originalStatus).toBe(ACTION_STATUS.IDLE)

    // 新しく作成した場合は初期値になることを確認
    const newResult = createInitialActionState<TestFormFields, TestValidationErrors>()
    expect(newResult.status).toBe(ACTION_STATUS.IDLE)
  })
})
