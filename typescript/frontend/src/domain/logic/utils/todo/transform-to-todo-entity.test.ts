import { describe, expect, it } from 'vitest';
import { transformToTodoEntity } from '@/domain/logic/utils/todo/transform-to-todo-entity';

describe('transformToTodoEntity', () => {
  // 前提：すべてのフィールドが有効な値で提供される
  // 期待値：すべてのフィールドが正しくマッピングされたTodoEntityが返される
  it('すべてのフィールドが提供された場合、正しくTodoEntityにマッピングされる', () => {
    // Arrange: 完全なプロパティを持つ入力データを準備する
    const input = {
      id: 1,
      title: 'Test Todo',
      description: 'Test Description',
      completed: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    // Act: transformToTodoEntity関数を実行してデータ変換を行う
    const result = transformToTodoEntity(input);

    // Assert: すべてのフィールドが正しくTodoEntityにマッピングされることを確認する
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
  it('descriptionがnullの場合、空文字列に変換されてマッピングされる', () => {
    // Arrange: descriptionがnullの入力データを準備する
    const input = {
      id: 2,
      title: 'Test Todo',
      description: null,
      completed: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    // Act: transformToTodoEntity関数を実行してnull値の変換を行う
    const result = transformToTodoEntity(input);

    // Assert: descriptionが空文字列に変換されることを確認する
    expect(result.description).toBe('');
    expect(result).toEqual({
      id: 2,
      title: 'Test Todo',
      description: '',
      isCompleted: false,
      createdDate: '2024-01-01T00:00:00Z',
      updatedDate: '2024-01-02T00:00:00Z',
    });
  });

  // 前提：updatedAtがnullな値
  // 期待値：updatedDateにcreatedAtの値が設定される
  it('updatedAtがnullの場合、createdAtの値がupdatedDateに設定される', () => {
    // Arrange: updatedAtがnullの入力データを準備する
    const input = {
      id: 3,
      title: 'Test Todo',
      description: 'Test Description',
      completed: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: null,
    };

    // Act: transformToTodoEntity関数を実行してnull値のフォールバック処理を行う
    const result = transformToTodoEntity(input);

    // Assert: updatedDateにcreatedAtの値が設定されることを確認する
    expect(result.updatedDate).toBe('2024-01-01T00:00:00Z');
    expect(result).toEqual({
      id: 3,
      title: 'Test Todo',
      description: 'Test Description',
      isCompleted: false,
      createdDate: '2024-01-01T00:00:00Z',
      updatedDate: '2024-01-01T00:00:00Z',
    });
  });
});
