import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/core/service/api.service';
import { deleteTodo } from '@/domain/logic/action/todo/delete-todo';
import { expectErrValue, expectOkValue } from '@/util/test-util/except-value';

// APIクライアントをモック化
vi.mock('@/core/service/api.service', () => ({
  apiClient: {
    api: {
      todos: {
        ':todoId': {
          $delete: vi.fn(),
        },
      },
    },
  },
}));

describe('deleteTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 前提：有効なtodoIdでAPIが正常なレスポンスを返す
  // 期待値：voidがok結果で返される
  it('正常にTodoを削除する', async () => {
    // Arrange: 削除対象のtodoIdとAPIの正常レスポンスを準備する
    const todoId = 1;

    const mockResponse = {
      ok: true,
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$delete).mockResolvedValue(mockResponse);

    // Act: deleteTodo関数を実行してTodoの削除を行う
    const result = await deleteTodo(todoId);

    // Assert: 削除が正常に完了してvoid（undefined）が返されることを確認する
    const value = expectOkValue(result);
    expect(value).toBeUndefined();
  });

  // 前提：APIが正常でないレスポンス（ok: false）を返す
  // 期待値：SERVER_ACTION_ERRORがerr結果で返される
  it('APIレスポンスが正常でない場合エラーが返される', async () => {
    // Arrange: 存在しないtodoIdとAPIのエラーレスポンスを準備する
    const todoId = 999;

    const mockResponse = {
      ok: false,
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$delete).mockResolvedValue(mockResponse);

    // Act: deleteTodo関数を実行してAPIエラーを発生させる
    const result = await deleteTodo(todoId);

    // Assert: SERVER_ACTION_ERRORが返されることを確認する
    const error = expectErrValue(result);
    expect(error).toBe('SERVER_ACTION_ERROR');
  });

  // 前提：API呼び出し時にネットワークエラーが発生する
  // 期待値：SERVER_ACTION_ERRORがerr結果で返される
  it('API呼び出しでエラーが発生した場合エラーが返される', async () => {
    // Arrange: 有効なtodoIdとネットワークエラーを発生させるモックを準備する
    const todoId = 1;

    vi.mocked(apiClient.api.todos[':todoId'].$delete).mockRejectedValue(new Error('Network Error'));

    // Act: deleteTodo関数を実行してネットワークエラーを発生させる
    const result = await deleteTodo(todoId);

    // Assert: SERVER_ACTION_ERRORが返されることを確認する
    const error = expectErrValue(result);
    expect(error).toBe('SERVER_ACTION_ERROR');
  });
});
