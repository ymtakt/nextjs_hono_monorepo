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

    // テスト対象の関数を実行
    const result = await deleteTodo(todoId);

    // 期待値の確認
    expect(result.isOk()).toBe(true);
    // 成功時のデータの確認
    if (result.isOk()) {
      // データの確認
      expect(result.value).toBeUndefined(); // voidなのでundefined
    }
    // モックの呼び出し確認
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

    // テスト対象の関数を実行
    await deleteTodo(todoId);

    // モックの呼び出し確認
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

    // テスト対象の関数を実行
    const result = await deleteTodo(todoId);

    // 期待値の確認
    expect(result.isErr()).toBe(true);
    // エラー時のデータの確認
    if (result.isErr()) {
      // エラーの内容が正しいか確認
      expect(result.error).toEqual({ type: 'TODO_DELETE_FAILED' });
    }
  });

  // 前提：API呼び出し時にネットワークエラーが発生する
  // 期待値：TODO_DELETE_FAILEDエラーがerr結果で返される
  it('API呼び出しでエラーが発生した場合エラーが返される', async () => {
    const todoId = 1;

    vi.mocked(apiClient.api.todos[':todoId'].$delete).mockRejectedValue(new Error('Network Error'));

    // テスト対象の関数を実行
    const result = await deleteTodo(todoId);

    // 期待値の確認
    expect(result.isErr()).toBe(true);
    // エラー時のデータの確認
    if (result.isErr()) {
      // エラーの内容が正しいか確認
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

    // テスト対象の関数を実行
    const result1 = await deleteTodo(1);
    const result2 = await deleteTodo(2);

    // 期待値の確認
    expect(result1.isOk()).toBe(true);
    expect(result2.isOk()).toBe(true);

    // モックの呼び出し確認
    expect(apiClient.api.todos[':todoId'].$delete).toHaveBeenCalledTimes(2);
    expect(apiClient.api.todos[':todoId'].$delete).toHaveBeenNthCalledWith(1, {
      param: { todoId: '1' },
    });
    expect(apiClient.api.todos[':todoId'].$delete).toHaveBeenNthCalledWith(2, {
      param: { todoId: '2' },
    });
  });
});
