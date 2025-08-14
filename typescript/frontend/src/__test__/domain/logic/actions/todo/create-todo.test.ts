/**
 * todo.use-case.ts のテスト。
 * use-case層のビジネスロジックとAPI呼び出しの正常系とエラー系を検証する。
 */

import { createTodo } from 'backend/src/repository/mutation/todo/createTodo'
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

  describe('createTodo', () => {
    /**
     * 正常にTodoを作成できることを検証する。
     */
    it('正常にTodoを作成する', async () => {
      const createRequest = {
        title: '新しいTodo',
        description: '新しい説明',
        completed: false,
      }

      const mockResponse = {
        todo: {
          id: 2,
          title: '新しいTodo',
          description: '新しい説明',
          completed: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      }

      const mockApiResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      }

      vi.mocked(apiClient.api.todos.$post).mockResolvedValue(mockApiResponse as any)

      const result = await createTodo(createRequest)

      expect(result).toEqual({
        id: 2,
        title: '新しいTodo',
        description: '新しい説明',
        isCompleted: false,
        createdDate: '2025-01-01T00:00:00Z',
        updatedDate: '2025-01-01T00:00:00Z',
      })
      expect(apiClient.api.todos.$post).toHaveBeenCalledWith({
        json: createRequest,
      })
    })

    /**
     * バリデーションエラー時にApplicationErrorを投げることを検証する。
     */
    it('バリデーションエラー時にApplicationErrorを投げる', async () => {
      const createRequest = {
        title: '',
        description: '説明のみ',
        completed: false,
      }

      const mockResponse = {
        ok: false,
        statusText: 'endpoint.createTodo.validationError.1',
      }

      vi.mocked(apiClient.api.todos.$post).mockResolvedValue(mockResponse as any)

      await expect(createTodo(createRequest)).rejects.toThrow(ApplicationError)

      try {
        await createTodo(createRequest)
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError)
        expect((error as ApplicationError).message).toBe('フォームデータが無効です')
      }
    })
  })
})
