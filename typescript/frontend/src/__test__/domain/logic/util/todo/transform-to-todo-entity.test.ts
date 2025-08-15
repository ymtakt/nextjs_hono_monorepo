import { describe, expect, it } from 'vitest'
import { transformToTodoEntity } from '@/domain/logic/utils/todo/transform-to-todo-entity'

describe('transformToTodoEntity', () => {
  // 前提：完全なデータを持つTodoオブジェクトが渡される
  // 期待値：すべてのフィールドが正しくマッピングされたTodoEntityが返される
  it('完全なデータが正しく変換される', () => {
    const todoObject = {
      id: 1,
      title: 'テストタスク',
      description: 'テストの説明',
      completed: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-16T10:00:00Z',
    }

    const result = transformToTodoEntity(todoObject)

    expect(result).toEqual({
      id: 1,
      title: 'テストタスク',
      description: 'テストの説明',
      isCompleted: true,
      createdDate: '2024-01-15T10:00:00Z',
      updatedDate: '2024-01-16T10:00:00Z',
    })
  })

  // 前提：descriptionが空文字のTodoオブジェクトが渡される
  // 期待値：descriptionが空文字として変換される
  it('descriptionが空文字の場合そのまま変換される', () => {
    const todoObject = {
      id: 2,
      title: 'タスク',
      description: '',
      completed: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    }

    const result = transformToTodoEntity(todoObject)

    expect(result.description).toBe('')
  })

  // 前提：updatedAtがないTodoオブジェクトが渡される
  // 期待値：updatedDateにcreatedAtの値が設定される
  it('updatedAtがない場合はcreatedAtが使用される', () => {
    const todoObject = {
      id: 3,
      title: 'タスク',
      description: '説明',
      completed: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '',
    }

    const result = transformToTodoEntity(todoObject)

    expect(result.updatedDate).toBe('2024-01-15T10:00:00Z')
  })

  // 前提：completedがfalseのTodoオブジェクトが渡される
  // 期待値：isCompletedがfalseに変換される
  it('completed false がisCompleted falseに変換される', () => {
    const todoObject = {
      id: 4,
      title: '未完了タスク',
      description: '説明',
      completed: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    }

    const result = transformToTodoEntity(todoObject)

    expect(result.isCompleted).toBe(false)
  })

  // 前提：completedがtrueのTodoオブジェクトが渡される
  // 期待値：isCompletedがtrueに変換される
  it('completed true がisCompleted trueに変換される', () => {
    const todoObject = {
      id: 5,
      title: '完了タスク',
      description: '説明',
      completed: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    }

    const result = transformToTodoEntity(todoObject)

    expect(result.isCompleted).toBe(true)
  })
})
