import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/core/service/api.service';
import { fetchTodos } from '@/domain/logic/ssr/todo/fetch-todos';
import { expectErrValue, expectOkValue } from '@/util/test-util/except-value';

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
  });

  // 前提：APIが正常なレスポンスで複数のTodoを返す
  // 期待値：変換されたTodoEntity配列がok結果で返される
  it('正常に複数のTodoを取得して変換される', async () => {
    // Arrange: 準備
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
      ],
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockTodos),
    };

    // Note: テスト用のmockなので型チェックをスキップ
    // @ts-expect-error
    vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse);

    // Act: 呼び出し
    const result = await fetchTodos();

    // Assert: 検証
    const todoEntities = expectOkValue(result);
    expect(todoEntities).toHaveLength(1);
    expect(todoEntities[0]).toEqual({
      id: 1,
      title: 'Todo1',
      description: '説明1',
      isCompleted: true,
      createdDate: '2025-01-01T00:00:00Z',
      updatedDate: '2025-01-02T00:00:00Z',
    });
  });

  // 前提：search パラメータ付きでAPIが呼び出され、検索にマッチするTodoが返される
  // 期待値：検索キーワードを含むTodoのみが変換されて返される
  it('searchパラメータで検索にマッチするTodoを取得する', async () => {
    // Arrange: 準備
    const mockTodos = {
      todos: [
        {
          id: 1,
          title: 'React学習',
          description: 'Reactの基礎を学ぶ',
          completed: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 2,
          title: 'React応用',
          description: 'Reactの応用を学ぶ',
          completed: true,
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ],
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockTodos),
    };

    // Note: テスト用のmockなので型チェックをスキップ
    // @ts-expect-error
    vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse);

    // Act: 呼び出し
    const result = await fetchTodos('React');

    // Assert: 検証
    expect(apiClient.api.todos.$get).toHaveBeenCalledWith({
      query: {
        search: 'React',
      },
    });

    const todoEntities = expectOkValue(result);
    expect(todoEntities).toHaveLength(2);
    expect(todoEntities).toEqual([
      {
        id: 1,
        title: 'React学習',
        description: 'Reactの基礎を学ぶ',
        isCompleted: false,
        createdDate: '2025-01-01T00:00:00Z',
        updatedDate: '2025-01-01T00:00:00Z',
      },
      {
        id: 2,
        title: 'React応用',
        description: 'Reactの応用を学ぶ',
        isCompleted: true,
        createdDate: '2025-01-02T00:00:00Z',
        updatedDate: '2025-01-02T00:00:00Z',
      },
    ]);
  });

  // 前提：APIが正常でないレスポンス（ok: false）を返す
  // 期待値：SSR_FETCH_ERRORがerr結果で返される
  it('APIレスポンスが正常でない場合エラーが返される', async () => {
    // Arrange: 準備
    const mockResponse = { ok: false };

    // Note: テスト用のmockなので型チェックをスキップ
    // @ts-expect-error
    vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse);

    // Act: 呼び出し
    const result = await fetchTodos();

    // Assert: 検証
    const error = expectErrValue(result);
    expect(error).toBe('SSR_FETCH_ERROR');
  });

  // 前提：API呼び出し時にネットワークエラーが発生する
  // 期待値：SSR_FETCH_ERRORがerr結果で返される
  it('API呼び出しでエラーが発生した場合エラーが返される', async () => {
    // Arrange: 準備
    vi.mocked(apiClient.api.todos.$get).mockRejectedValue(new Error('Network Error'));

    // Act: 呼び出し
    const result = await fetchTodos();

    // Assert: 検証
    const error = expectErrValue(result);
    expect(error).toBe('SSR_FETCH_ERROR');
  });
});
