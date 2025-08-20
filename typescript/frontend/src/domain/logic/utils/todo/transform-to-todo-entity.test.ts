import { describe, expect, it } from 'vitest';
import { transformToTodoEntity } from '@/domain/logic/utils/todo/transform-to-todo-entity';

describe('transformToTodoEntity', () => {
  // 前提：すべてのフィールドが有効な値で提供される
  // 期待値：すべてのフィールドが正しくマッピングされたTodoEntityが返される
  it('すべてのフィールドが提供された場合、正しくTodoEntityにマッピングされる', () => {
    const input = {
      id: 1,
      title: 'Test Todo',
      description: 'Test Description',
      completed: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    const result = transformToTodoEntity(input);

    expect(result).toEqual({
      id: 1,
      title: 'Test Todo',
      description: 'Test Description',
      isCompleted: true,
      createdDate: '2024-01-01T00:00:00Z',
      updatedDate: '2024-01-02T00:00:00Z',
    });
  });

  // 前提：descriptionがnullな値
  // 期待値：descriptionが空文字列に変換される
  it('descriptionが空文字列の場合、空文字列のままマッピングされる', () => {
    const input = {
      id: 2,
      title: 'Test Todo',
      description: null,
      completed: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    const result = transformToTodoEntity(input);

    expect(result.description).toBe('');
  });

  // 前提：updatedAtがnullな値
  // 期待値：updatedDateにcreatedAtの値が設定される
  it('updatedAtが空文字列の場合、createdAtの値がupdatedDateに設定される', () => {
    const input = {
      id: 3,
      title: 'Test Todo',
      description: 'Test Description',
      completed: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: null,
    };

    const result = transformToTodoEntity(input);

    expect(result.updatedDate).toBe('2024-01-01T00:00:00Z');
  });
});
