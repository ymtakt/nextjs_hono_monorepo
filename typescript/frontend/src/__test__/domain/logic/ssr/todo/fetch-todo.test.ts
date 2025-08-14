/**
 * todo.use-case.ts のテスト。
 * use-case層のビジネスロジックとAPI呼び出しの正常系とエラー系を検証する。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/core/services/api.service'
import { fetchTodo } from '@/domain/logic/ssr/todo/fetch-todo'

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

  describe('fetchTodo', () => {
    /**
     * 正常に個別Todoを取得できることを検証する。
     */
    it('正常に個別Todoを取得する', async () => {
      const mockTodo = {
        todo: {
          id: 1,
          title: '個別テストTodo',
          description: '個別テスト説明',
          completed: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockTodo),
      }

      vi.mocked(apiClient.api.todos[':todoId'].$get).mockResolvedValue(mockResponse as any)

      const result = await fetchTodo(1)

      expect(result).toEqual({
        id: 1,
        title: '個別テストTodo',
        description: '個別テスト説明',
        isCompleted: true,
        createdDate: '2025-01-01T00:00:00Z',
        updatedDate: '2025-01-02T00:00:00Z',
      })
      expect(apiClient.api.todos[':todoId'].$get).toHaveBeenCalledWith({
        param: { todoId: '1' },
      })
    })

    /**
     * 外部エラーコードでApplicationErrorを投げることを検証する。
     */
    it('外部エラーコードでApplicationErrorを投げる', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'endpoint.getTodos.fetchFailed.1',
      }

      vi.mocked(apiClient.api.todos[':todoId'].$get).mockResolvedValue(mockResponse as any)

      await expect(fetchTodo(999)).rejects.toThrow(ApplicationError)

      try {
        await fetchTodo(999)
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError)
        expect((error as ApplicationError).message).toBe('TodoIDが見つかりません')
      }
    })
  })
})
