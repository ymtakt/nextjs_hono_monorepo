import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/core/service/api.service';
import { fetchTodo } from '@/domain/logic/ssr/todo/fetch-todo';

// APIクライアントをモック化
vi.mock('@/core/service/api.service', () => ({
  apiClient: {
    api: {
      todos: {
        ':todoId': {
          $get: vi.fn(),
        },
      },
    },
  },
}));

describe('fetchTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 前提：APIが正常なレスポンスを返し、transformToTodoEntityが正常に動作する
  // 期待値：変換されたTodoEntityがok結果で返される
  it('正常にTodoを取得して変換される', async () => {
    const mockTodo = {
      todo: {
        id: 1,
        title: 'テストTodo',
        description: 'テスト説明',
        completed: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      },
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockTodo),
    };

    // Note: テスト用のmockなので型チェックをスキップ
    // @ts-expect-error 
    vi.mocked(apiClient.api.todos[':todoId'].$get).mockResolvedValue(mockResponse);

    const result = await fetchTodo(1);

    // Resultの型がokであることを確認
    expect(result.isOk()).toBe(true);

    // 正しくTodoEntityに変換されて返されることを確認
    if (result.isOk()) {
      expect(result.value).toEqual({
        id: 1,
        title: 'テストTodo',
        description: 'テスト説明',
        isCompleted: true,
        createdDate: '2025-01-01T00:00:00Z',
        updatedDate: '2025-01-02T00:00:00Z',
      });
    }
  });

  // 前提：APIが正常でないレスポンス（ok: false）を返す
  // 期待値：SSR_FETCH_ERRORがerr結果で返される
  it('APIレスポンスが正常でない場合エラーが返される', async () => {
    const mockResponse = {
      ok: false,
    };

    // Note: テスト用のmockなので型チェックをスキップ
    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$get).mockResolvedValue(mockResponse);

    const result = await fetchTodo(999);

    // Resultの型がerrであることを確認
    expect(result.isErr()).toBe(true);

    // エラーがSSR_FETCH_ERRORであることを確認
    if (result.isErr()) {
      expect(result.error).toBe('SSR_FETCH_ERROR');
    }
  });

  // 前提：API呼び出し時にネットワークエラーが発生する
  // 期待値：SSR_FETCH_ERRORがerr結果で返される
  it('API呼び出しでエラーが発生した場合エラーが返される', async () => {
    vi.mocked(apiClient.api.todos[':todoId'].$get).mockRejectedValue(new Error('Network Error'));

    const result = await fetchTodo(1);

    // Resultの型がerrであることを確認
    expect(result.isErr()).toBe(true);

    // エラーがSSR_FETCH_ERRORであることを確認
    if (result.isErr()) {
      expect(result.error).toBe('SSR_FETCH_ERROR');
    }
  });
});