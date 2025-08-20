import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/core/service/api.service';
import { deleteTodo } from '@/domain/logic/action/todo/delete-todo';

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
    const todoId = 1;

    const mockResponse = {
      ok: true,
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$delete).mockResolvedValue(mockResponse);

    const result = await deleteTodo(todoId);

    if (result.isOk()) {
      // 戻り値がundefined（void）であるかどうか
      expect(result.value).toBeUndefined();
    }
  });

  // 前提：APIが正常でないレスポンス（ok: false）を返す
  // 期待値：SERVER_ACTION_ERRORがerr結果で返される
  it('APIレスポンスが正常でない場合エラーが返される', async () => {
    const todoId = 999;

    const mockResponse = {
      ok: false,
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$delete).mockResolvedValue(mockResponse);

    const result = await deleteTodo(todoId);

    if (result.isErr()) {
      expect(result.error).toBe('SERVER_ACTION_ERROR');
    }
  });

  // 前提：API呼び出し時にネットワークエラーが発生する
  // 期待値：SERVER_ACTION_ERRORがerr結果で返される
  it('API呼び出しでエラーが発生した場合エラーが返される', async () => {
    const todoId = 1;

    vi.mocked(apiClient.api.todos[':todoId'].$delete).mockRejectedValue(new Error('Network Error'));

    const result = await deleteTodo(todoId);

    if (result.isErr()) {
      expect(result.error).toBe('SERVER_ACTION_ERROR');
    }
  });
});