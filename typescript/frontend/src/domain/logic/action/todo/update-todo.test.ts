import type { UpdateTodoRequest } from 'backend/schemas';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/core/service/api.service';
import { updateTodo } from '@/domain/logic/action/todo/update-todo';
import { expectErrValue, expectOkValue } from '@/util/test-util/except-value';

// APIクライアントをモック化
vi.mock('@/core/service/api.service', () => ({
  apiClient: {
    api: {
      todos: {
        ':todoId': {
          $put: vi.fn(),
        },
      },
    },
  },
}));

describe('updateTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 前提：有効なtodoIdとUpdateTodoRequestでAPIが正常なレスポンスを返す
  // 期待値：更新されたTodoEntityがok結果で返される
  it('正常にTodoを更新して変換される', async () => {
    // Arrange: todoIdと更新リクエスト、APIの正常レスポンスを準備する
    const todoId = 1;
    const updateRequest: UpdateTodoRequest = {
      title: '更新されたTodo',
      description: '更新された説明',
      completed: true,
    };

    const mockUpdatedTodo = {
      todo: {
        id: 1,
        title: '更新されたTodo',
        description: '更新された説明',
        completed: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      },
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockUpdatedTodo),
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$put).mockResolvedValue(mockResponse);

    // Act: updateTodo関数を実行してTodoの更新を行う
    const result = await updateTodo(todoId, updateRequest);

    // Assert: 更新されたTodoEntityが正しく変換されて返されることを確認する
    const todoEntity = expectOkValue(result);
    expect(todoEntity).toEqual({
      id: 1,
      title: '更新されたTodo',
      description: '更新された説明',
      isCompleted: true,
      createdDate: '2025-01-01T00:00:00Z',
      updatedDate: '2025-01-02T00:00:00Z',
    });
  });

  // 前提：APIが正常でないレスポンス（ok: false）を返す
  // 期待値：SERVER_ACTION_ERRORがerr結果で返される
  it('APIレスポンスが正常でない場合エラーが返される', async () => {
    // Arrange: 存在しないtodoIdと更新リクエスト、APIのエラーレスポンスを準備する
    const todoId = 999;
    const updateRequest: UpdateTodoRequest = {
      title: 'エラーテスト',
      description: 'エラーテストの説明',
      completed: false,
    };

    const mockResponse = {
      ok: false,
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$put).mockResolvedValue(mockResponse);

    // Act: updateTodo関数を実行してAPIエラーを発生させる
    const result = await updateTodo(todoId, updateRequest);

    // Assert: SERVER_ACTION_ERRORが返されることを確認する
    const error = expectErrValue(result);
    expect(error).toBe('SERVER_ACTION_ERROR');
  });

  // 前提：API呼び出し時にネットワークエラーが発生する
  // 期待値：SERVER_ACTION_ERRORがerr結果で返される
  it('API呼び出しでエラーが発生した場合エラーが返される', async () => {
    // Arrange: 有効なパラメータとネットワークエラーを発生させるモックを準備する
    const todoId = 1;
    const updateRequest: UpdateTodoRequest = {
      title: 'エラーテスト',
      description: 'ネットワークエラーテストの説明',
      completed: false,
    };

    vi.mocked(apiClient.api.todos[':todoId'].$put).mockRejectedValue(new Error('Network Error'));

    // Act: updateTodo関数を実行してネットワークエラーを発生させる
    const result = await updateTodo(todoId, updateRequest);

    // Assert: SERVER_ACTION_ERRORが返されることを確認する
    const error = expectErrValue(result);
    expect(error).toBe('SERVER_ACTION_ERROR');
  });
});
