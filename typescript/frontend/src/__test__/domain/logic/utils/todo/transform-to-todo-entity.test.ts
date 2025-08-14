/**
 * todo.use-case.ts のテスト。
 * use-case層のビジネスロジックとAPI呼び出しの正常系とエラー系を検証する。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { transformToTodoEntity } from '@/domain/logic/utils/todo/transform-to-todo-entity'

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
})
