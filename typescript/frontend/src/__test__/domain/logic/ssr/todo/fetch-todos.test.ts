/**
 * todo.use-case.ts のテスト。
 * use-case層のビジネスロジックとAPI呼び出しの正常系とエラー系を検証する。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/core/services/api.service'
import { fetchTodos } from '@/domain/logic/ssr/todo/fetch-todos'

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

  describe('fetchTodos', () => {
    /**
     * 正常にTodoリストを取得できることを検証する。
     */
    it('正常にTodoリストを取得する', async () => {
      const mockTodos = {
        todos: [
          {
            id: 1,
            title: 'テストTodo',
            description: 'テスト説明',
            completed: false,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
          {
            id: 2,
            title: 'テストTodo2',
            description: 'テスト説明2',
            completed: true,
            createdAt: '2025-01-02T00:00:00Z',
            updatedAt: '2025-01-02T00:00:00Z',
          },
        ],
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockTodos),
      }

      vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse as any)

      const result = await fetchTodos()

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 1,
        title: 'テストTodo',
        description: 'テスト説明',
        isCompleted: false,
        createdDate: '2025-01-01T00:00:00Z',
        updatedDate: '2025-01-01T00:00:00Z',
      })
      expect(apiClient.api.todos.$get).toHaveBeenCalledTimes(1)
    })

    /**
     * 外部エラーコードでApplicationErrorを投げることを検証する。
     */
    it('外部エラーコードでApplicationErrorを投げる', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'endpoint.getTodos.fetchFailed.1',
      }

      vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse as any)

      await expect(fetchTodos()).rejects.toThrow(ApplicationError)

      try {
        await fetchTodos()
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError)
        expect((error as ApplicationError).message).toBe('TodoIDが見つかりません')
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

      vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse as any)

      await expect(fetchTodos()).rejects.toThrow(Error)
    })
  })
})
