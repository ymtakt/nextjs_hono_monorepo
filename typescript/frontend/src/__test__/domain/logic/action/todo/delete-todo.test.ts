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

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeUndefined(); // voidなのでundefined
    }
    expect(apiClient.api.todos[':todoId'].$delete).toHaveBeenCalledWith({
      param: { todoId: '1' },
    });
  });

  // 前提：todoIdが数値で渡される
  // 期待値：todoIdが文字列に変換されてAPIに渡される
  it('todoIdが文字列に変換されてAPIに渡される', async () => {
    const todoId = 123;

    const mockResponse = {
      ok: true,
    };
    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$delete).mockResolvedValue(mockResponse);

    await deleteTodo(todoId);

    expect(apiClient.api.todos[':todoId'].$delete).toHaveBeenCalledWith({
      param: { todoId: '123' },
    });
  });

  // 前提：APIが正常でないレスポンス（ok: false）を返す
  // 期待値：TODO_DELETE_FAILEDエラーがerr結果で返される
  it('APIレスポンスが正常でない場合エラーが返される', async () => {
    const todoId = 999;

    const mockResponse = {
      ok: false,
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$delete).mockResolvedValue(mockResponse);

    const result = await deleteTodo(todoId);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toEqual({ type: 'TODO_DELETE_FAILED' });
    }
  });

  // 前提：API呼び出し時にネットワークエラーが発生する
  // 期待値：TODO_DELETE_FAILEDエラーがerr結果で返される
  it('API呼び出しでエラーが発生した場合エラーが返される', async () => {
    const todoId = 1;

    vi.mocked(apiClient.api.todos[':todoId'].$delete).mockRejectedValue(new Error('Network Error'));

    const result = await deleteTodo(todoId);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toEqual({ type: 'TODO_DELETE_FAILED' });
    }
  });

  // 前提：削除操作が連続で実行される
  // 期待値：それぞれ独立して正常に処理される
  it('複数のTodoを連続で削除できる', async () => {
    const mockResponse = {
      ok: true,
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$delete).mockResolvedValue(mockResponse);

    const result1 = await deleteTodo(1);
    const result2 = await deleteTodo(2);

    expect(result1.isOk()).toBe(true);
    expect(result2.isOk()).toBe(true);

    expect(apiClient.api.todos[':todoId'].$delete).toHaveBeenCalledTimes(2);
    expect(apiClient.api.todos[':todoId'].$delete).toHaveBeenNthCalledWith(1, {
      param: { todoId: '1' },
    });
    expect(apiClient.api.todos[':todoId'].$delete).toHaveBeenNthCalledWith(2, {
      param: { todoId: '2' },
    });
  });
});
