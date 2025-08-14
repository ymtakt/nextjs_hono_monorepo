/**
 * todo.use-case.ts のテスト。
 * use-case層のビジネスロジックとAPI呼び出しの正常系とエラー系を検証する。
 */

import { deleteTodo } from 'backend/src/repository/mutation/todo/deleteTodo'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/core/services/api.service'

// APIクライアントをモック化
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    api: {
      todos: {
        $get: vi.fn(),
        $post: vi.fn(),
        ':todoId': {
          $get: vi.fn(),
          $put: vi.fn(),
          $delete: vi.fn(),
        },
      },
    },
  },
}))

// setTimeoutをモック化してテスト時間を短縮
vi.mock('timers', () => ({
  setTimeout: vi.fn((callback) => callback()),
}))

describe('todo.use-case', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // setTimeoutをモック化
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback()
      return {} as any
    })
  })

  describe('deleteTodo', () => {
    /**
     * 正常にTodoを削除できることを検証する。
     */
    it('正常にTodoを削除する', async () => {
      const mockResponse = {
        ok: true,
      }

      vi.mocked(apiClient.api.todos[':todoId'].$delete).mockResolvedValue(mockResponse as any)

      await expect(deleteTodo(1)).resolves.toBeUndefined()

      expect(apiClient.api.todos[':todoId'].$delete).toHaveBeenCalledWith({
        param: { todoId: '1' },
      })
    })

    /**
     * バリデーションエラー時にApplicationErrorを投げることを検証する。
     */
    it('バリデーションエラー時にApplicationErrorを投げる', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'endpoint.deleteTodo.validationError.1',
      }

      vi.mocked(apiClient.api.todos[':todoId'].$delete).mockResolvedValue(mockResponse as any)

      await expect(deleteTodo(999)).rejects.toThrow(ApplicationError)

      try {
        await deleteTodo(999)
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError)
        expect((error as ApplicationError).message).toBe('フォームデータが無効です')
      }
    })

    /**
     * 未知のエラーで一般Errorを投げることを検証する。
     */
    it('未知のエラーで一般Errorを投げる', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Unknown Error',
      }

      vi.mocked(apiClient.api.todos[':todoId'].$delete).mockResolvedValue(mockResponse as any)

      await expect(deleteTodo(1)).rejects.toThrow(Error)
    })
  })
})
