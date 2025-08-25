import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/core/service/api.service';
import { fetchTodo } from '@/domain/logic/ssr/todo/fetch-todo';
import { expectErrValue, expectOkValue } from '@/util/test-util/except-value';

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
    // Arrange: 準備
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

    // Act: 呼び出し
    const result = await fetchTodo(1);

    // Assert: 検証
    expect(result.isOk()).toBe(true);

    const todoEntity = expectOkValue(result);
    expect(todoEntity).toEqual({
      id: 1,
      title: 'テストTodo',
      description: 'テスト説明',
      isCompleted: true,
      createdDate: '2025-01-01T00:00:00Z',
      updatedDate: '2025-01-02T00:00:00Z',
    });
  });

  // 前提：APIが正常でないレスポンス（ok: false）を返す
  // 期待値：SSR_FETCH_ERRORがerr結果で返される
  it('APIレスポンスが正常でない場合エラーが返される', async () => {
    // Arrange: 準備
    const mockResponse = {
      ok: false,
    };

    // Note: テスト用のmockなので型チェックをスキップ
    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$get).mockResolvedValue(mockResponse);

    // Act: 呼び出し
    const result = await fetchTodo(999);

    // Assert: 検証
    expect(result.isErr()).toBe(true);

    const error = expectErrValue(result);
    expect(error).toBe('SSR_FETCH_ERROR');
  });

  // 前提：API呼び出し時にネットワークエラーが発生する
  // 期待値：SSR_FETCH_ERRORがerr結果で返される
  it('API呼び出しでエラーが発生した場合エラーが返される', async () => {
    // Arrange: 準備
    vi.mocked(apiClient.api.todos[':todoId'].$get).mockRejectedValue(new Error('Network Error'));

    // Act: 呼び出し
    const result = await fetchTodo(1);

    // Assert: 検証
    expect(result.isErr()).toBe(true);

    const error = expectErrValue(result);
    expect(error).toBe('SSR_FETCH_ERROR');
  });
});
