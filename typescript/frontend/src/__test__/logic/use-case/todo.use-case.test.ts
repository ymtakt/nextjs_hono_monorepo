/* eslint-disable @typescript-eslint/no-explicit-any */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/apiClient'
import {
  createTodo,
  deleteTodo,
  fetchTodo,
  fetchTodos,
  transformToTodoEntity,
  updateTodo,
} from '@/logic/use-case/todo.use-case'
import { ApplicationError } from '@/utils/errors'

/**
 * todo.use-case.ts のテスト。
 * use-case層のビジネスロジックとAPI呼び出しの正常系とエラー系を検証する。
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

  describe('transformToTodoEntity', () => {
    /**
     * 完全なAPIデータが正しく変換されることを検証する。
     */
    it('完全なAPIデータが正しく変換される', () => {
      const apiTodo = {
        id: 1,
        title: 'テストタイトル',
        description: 'テスト説明',
        completed: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      }

      const result = transformToTodoEntity(apiTodo)

      expect(result).toEqual({
        id: 1,
        title: 'テストタイトル',
        description: 'テスト説明',
        isCompleted: true,
        createdDate: '2024-01-01T00:00:00Z',
        updatedDate: '2024-01-02T00:00:00Z',
      })
    })

    /**
     * descriptionがnullの場合に空文字に変換されることを検証する。
     */
    it('descriptionがnullの場合に空文字に変換される', () => {
      const apiTodo = {
        id: 2,
        title: 'タイトルのみ',
        description: null as any,
        completed: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const result = transformToTodoEntity(apiTodo)

      expect(result.description).toBe('')
    })

    /**
     * descriptionがundefinedの場合に空文字に変換されることを検証する。
     */
    it('descriptionがundefinedの場合に空文字に変換される', () => {
      const apiTodo = {
        id: 3,
        title: 'タイトルのみ',
        description: undefined as any,
        completed: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const result = transformToTodoEntity(apiTodo)

      expect(result.description).toBe('')
    })

    /**
     * updatedAtがnullの場合にcreatedAtが使用されることを検証する。
     */
    it('updatedAtがnullの場合にcreatedAtが使用される', () => {
      const apiTodo = {
        id: 4,
        title: '更新なし',
        description: '説明',
        completed: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: null as any,
      }

      const result = transformToTodoEntity(apiTodo)

      expect(result.updatedDate).toBe('2024-01-01T00:00:00Z')
    })

    /**
     * completedフィールドがisCompletedに正しくマッピングされることを検証する。
     */
    it('completedフィールドがisCompletedに正しくマッピングされる', () => {
      const apiTodoTrue = {
        id: 6,
        title: '完了済み',
        description: '説明',
        completed: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const apiTodoFalse = {
        id: 7,
        title: '未完了',
        description: '説明',
        completed: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const resultTrue = transformToTodoEntity(apiTodoTrue)
      const resultFalse = transformToTodoEntity(apiTodoFalse)

      expect(resultTrue.isCompleted).toBe(true)
      expect(resultFalse.isCompleted).toBe(false)
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
