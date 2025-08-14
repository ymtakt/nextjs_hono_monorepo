/**
 * todo.use-case.ts のテスト。
 * use-case層のビジネスロジックとAPI呼び出しの正常系とエラー系を検証する。
 */

import { updateTodo } from 'backend/src/repository/mutation/todo/updateTodo'
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

  describe('updateTodo', () => {
    /**
     * 正常にTodoを更新できることを検証する。
     */
    it('正常にTodoを更新する', async () => {
      const updateRequest = {
        title: '更新されたTodo',
        description: '更新された説明',
        completed: true,
      }

      const mockResponse = {
        todo: {
          id: 1,
          title: '更新されたTodo',
          description: '更新された説明',
          completed: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-03T00:00:00Z',
        },
      }

      const mockApiResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      }

      vi.mocked(apiClient.api.todos[':todoId'].$put).mockResolvedValue(mockApiResponse as any)

      const result = await updateTodo(1, updateRequest)

      expect(result).toEqual({
        id: 1,
        title: '更新されたTodo',
        description: '更新された説明',
        isCompleted: true,
        createdDate: '2025-01-01T00:00:00Z',
        updatedDate: '2025-01-03T00:00:00Z',
      })
      expect(apiClient.api.todos[':todoId'].$put).toHaveBeenCalledWith({
        param: { todoId: '1' },
        json: updateRequest,
      })
    })

    /**
     * バリデーションエラー時にApplicationErrorを投げることを検証する。
     */
    it('バリデーションエラー時にApplicationErrorを投げる', async () => {
      const updateRequest = {
        title: '',
        description: '説明',
        completed: false,
      }

      const mockResponse = {
        ok: false,
        statusText: 'endpoint.updateTodo.validationError.1',
      }

      vi.mocked(apiClient.api.todos[':todoId'].$put).mockResolvedValue(mockResponse as any)

      await expect(updateTodo(999, updateRequest)).rejects.toThrow(ApplicationError)

      try {
        await updateTodo(999, updateRequest)
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError)
        expect((error as ApplicationError).message).toBe('フォームデータが無効です')
      }
    })
  })
})
