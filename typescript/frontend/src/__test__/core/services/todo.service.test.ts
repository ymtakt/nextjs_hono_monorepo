/* eslint-disable @typescript-eslint/no-explicit-any */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createTodo,
  deleteTodo,
  fetchTodo,
  fetchTodos,
  updateTodo,
} from '@/core/services/todo.service'
import { apiClient } from '@/lib/apiClient'
import { ApiError } from '@/utils/errors'

/**
 * todo.service.ts のテスト。
 * 各API呼び出し関数の正常系とエラー系を検証する。
 */

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

describe('todo.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
        ],
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockTodos),
      }

      vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse as any)

      const result = await fetchTodos()

      expect(result).toEqual(mockTodos)
      expect(apiClient.api.todos.$get).toHaveBeenCalledTimes(1)
    })

    /**
     * APIエラー時に適切なApiErrorを投げることを検証する。
     */
    it('APIエラー時に適切なApiErrorを投げる', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Internal Server Error'),
      }

      vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse as any)

      await expect(fetchTodos()).rejects.toThrow(ApiError)
      await expect(fetchTodos()).rejects.toThrow('Internal Server Error')
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

      expect(result).toEqual(mockTodo)
      expect(apiClient.api.todos[':todoId'].$get).toHaveBeenCalledWith({
        param: { todoId: '1' },
      })
    })

    /**
     * 存在しないTodoIDでApiErrorを投げることを検証する。
     */
    it('存在しないTodoIDでApiErrorを投げる', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        text: vi.fn().mockResolvedValue('Todo not found'),
      }

      vi.mocked(apiClient.api.todos[':todoId'].$get).mockResolvedValue(mockResponse as any)

      await expect(fetchTodo(999)).rejects.toThrow(ApiError)

      try {
        await fetchTodo(999)
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).status).toBe(404)
        expect((error as ApiError).message).toBe('Todo not found')
      }
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

      expect(result).toEqual(mockResponse)
      expect(apiClient.api.todos.$post).toHaveBeenCalledWith({
        json: createRequest,
      })
    })

    /**
     * バリデーションエラー時にApiErrorを投げることを検証する。
     */
    it('バリデーションエラー時にApiErrorを投げる', async () => {
      const createRequest = {
        title: '',
        description: '説明のみ',
        completed: false,
      }

      const mockResponse = {
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('Title is required'),
      }

      vi.mocked(apiClient.api.todos.$post).mockResolvedValue(mockResponse as any)

      await expect(createTodo(createRequest)).rejects.toThrow(ApiError)
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

      expect(result).toEqual(mockResponse)
      expect(apiClient.api.todos[':todoId'].$put).toHaveBeenCalledWith({
        param: { todoId: '1' },
        json: updateRequest,
      } as any)
    })

    /**
     * 存在しないTodoの更新でApiErrorを投げることを検証する。
     */
    it('存在しないTodoの更新でApiErrorを投げる', async () => {
      const updateRequest = {
        title: '存在しないTodo',
        description: '説明',
        completed: false,
      }

      const mockResponse = {
        ok: false,
        status: 404,
        text: vi.fn().mockResolvedValue('Todo not found'),
      }

      vi.mocked(apiClient.api.todos[':todoId'].$put).mockResolvedValue(mockResponse as any)

      await expect(updateTodo(999, updateRequest)).rejects.toThrow(ApiError)
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

      // 戻り値がvoidなので、エラーが投げられないことを確認
      await expect(deleteTodo(1)).resolves.toBeUndefined()

      expect(apiClient.api.todos[':todoId'].$delete).toHaveBeenCalledWith({
        param: { todoId: '1' },
      })
    })

    /**
     * 存在しないTodoの削除でApiErrorを投げることを検証する。
     */
    it('存在しないTodoの削除でApiErrorを投げる', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        text: vi.fn().mockResolvedValue('Todo not found'),
      }

      vi.mocked(apiClient.api.todos[':todoId'].$delete).mockResolvedValue(mockResponse as any)

      await expect(deleteTodo(999)).rejects.toThrow(ApiError)
    })

    /**
     * 権限エラーでApiErrorを投げることを検証する。
     */
    it('権限エラーでApiErrorを投げる', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        text: vi.fn().mockResolvedValue('Forbidden'),
      }

      vi.mocked(apiClient.api.todos[':todoId'].$delete).mockResolvedValue(mockResponse as any)

      try {
        await deleteTodo(1)
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).status).toBe(403)
        expect((error as ApiError).message).toBe('Forbidden')
      }
    })
  })
})
