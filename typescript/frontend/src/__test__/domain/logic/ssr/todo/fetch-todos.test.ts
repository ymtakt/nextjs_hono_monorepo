import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/core/service/api.service';
import { fetchTodos } from '@/domain/logic/ssr/todo/fetch-todos';

// APIクライアントをモック化
vi.mock('@/core/service/api.service', () => ({
  apiClient: {
    api: {
      todos: {
        $get: vi.fn(),
      },
    },
  },
}));

describe('fetchTodos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // setTimeoutをモック化
    vi.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      callback();
      return {} as unknown as NodeJS.Timeout;
    });
  });

  // 前提：APIが正常なレスポンスで複数のTodoを返す
  // 期待値：変換されたTodoEntity配列がok結果で返される
  it('正常に複数のTodoを取得して変換される', async () => {
    const mockTodos = {
      todos: [
        {
          id: 1,
          title: 'Todo1',
          description: '説明1',
          completed: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
        {
          id: 2,
          title: 'Todo2',
          description: '説明2',
          completed: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ],
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockTodos),
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse);

    // テスト対象の関数を実行
    const result = await fetchTodos();

    // 期待値の確認
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      // データの確認
      expect(result.value).toHaveLength(2);
      // データの確認
      expect(result.value[0]).toEqual({
        id: 1,
        title: 'Todo1',
        description: '説明1',
        isCompleted: true,
        createdDate: '2025-01-01T00:00:00Z',
        updatedDate: '2025-01-02T00:00:00Z',
      });
      // データの確認
      expect(result.value[1]).toEqual({
        id: 2,
        title: 'Todo2',
        description: '説明2',
        isCompleted: false,
        createdDate: '2025-01-01T00:00:00Z',
        updatedDate: '2025-01-01T00:00:00Z',
      });
    }
  });

  // 前提：APIが正常なレスポンスで空配列を返す
  // 期待値：空のTodoEntity配列がok結果で返される
  it('Todoが0件の場合空配列が返される', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ todos: [] }),
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse);

    // テスト対象の関数を実行
    const result = await fetchTodos();

    // 期待値の確認
    expect(result.isOk()).toBe(true);
    // 成功時のデータの確認
    if (result.isOk()) {
      // データの確認
      expect(result.value).toEqual([]);
    }
  });

  // 前提：search パラメータ付きでAPIが呼び出される
  // 期待値：search パラメータがクエリに含まれてAPIが呼ばれる
  it('searchパラメータがクエリに含まれる', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ todos: [] }),
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse);

    // テスト対象の関数を実行
    await fetchTodos('test search');

    // モックの呼び出し確認
    expect(apiClient.api.todos.$get).toHaveBeenCalledWith({
      query: {
        search: 'test search',
      },
    });
  });

  // 前提：search パラメータなしでAPIが呼び出される
  // 期待値：searchがundefinedのクエリでAPIが呼ばれる
  it('searchパラメータがない場合はundefinedが渡される', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ todos: [] }),
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse);

    // テスト対象の関数を実行
    await fetchTodos();

    // モックの呼び出し確認
    expect(apiClient.api.todos.$get).toHaveBeenCalledWith({
      query: {
        search: undefined,
      },
    });
  });

  // 前提：APIが正常でないレスポンス（ok: false）を返す
  // 期待値：TODO_FETCH_FAILEDエラーがerr結果で返される
  it('APIレスポンスが正常でない場合エラーが返される', async () => {
    const mockResponse = {
      ok: false,
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse);

    // テスト対象の関数を実行
    const result = await fetchTodos();

    // 期待値の確認
    expect(result.isErr()).toBe(true);
    // エラー時のデータの確認
    if (result.isErr()) {
      // エラーの内容が正しいか確認
      expect(result.error).toEqual({ type: 'TODO_FETCH_FAILED' });
    }
  });

  // 前提：API呼び出し時にネットワークエラーが発生する
  // 期待値：TODO_FETCH_FAILEDエラーがerr結果で返される
  it('API呼び出しでエラーが発生した場合エラーが返される', async () => {
    vi.mocked(apiClient.api.todos.$get).mockRejectedValue(new Error('Network Error'));

    // テスト対象の関数を実行
    const result = await fetchTodos();

    // 期待値の確認
    expect(result.isErr()).toBe(true);
    // エラー時のデータの確認
    if (result.isErr()) {
      // エラーの内容が正しいか確認
      expect(result.error).toEqual({ type: 'TODO_FETCH_FAILED' });
    }
  });
});
