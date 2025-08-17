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

// setTimeoutをモック化してテスト時間を短縮
vi.mock('timers', () => ({
  setTimeout: vi.fn((callback) => callback()),
}));

describe('fetchTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // setTimeoutをモック化
    vi.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      callback();
      return {} as unknown as NodeJS.Timeout;
    });
  });

  // 前提：APIが正常なレスポンスを返す
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

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$get).mockResolvedValue(mockResponse);

    const result = await fetchTodo(1);

    expect(result.isOk()).toBe(true);
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
    expect(apiClient.api.todos[':todoId'].$get).toHaveBeenCalledWith({
      param: { todoId: '1' },
    });
  });

  // 前提：APIが正常でないレスポンス（ok: false）を返す
  // 期待値：TODO_FETCH_FAILEDエラーがerr結果で返される
  it('APIレスポンスが正常でない場合エラーが返される', async () => {
    const mockResponse = {
      ok: false,
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$get).mockResolvedValue(mockResponse);

    const result = await fetchTodo(999);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toEqual({ type: 'TODO_FETCH_FAILED' });
    }
  });

  // 前提：API呼び出し時にネットワークエラーが発生する
  // 期待値：TODO_FETCH_FAILEDエラーがerr結果で返される
  it('API呼び出しでエラーが発生した場合エラーが返される', async () => {
    vi.mocked(apiClient.api.todos[':todoId'].$get).mockRejectedValue(new Error('Network Error'));

    const result = await fetchTodo(1);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toEqual({ type: 'TODO_FETCH_FAILED' });
    }
  });

  // 前提：正常なAPIレスポンスでtodoIdが数値で渡される
  // 期待値：todoIdが文字列に変換されてAPIに渡される
  it('todoIdが文字列に変換されてAPIに渡される', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        todo: {
          id: 123,
          title: 'test',
          description: 'test',
          completed: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      }),
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$get).mockResolvedValue(mockResponse);

    await fetchTodo(123);

    expect(apiClient.api.todos[':todoId'].$get).toHaveBeenCalledWith({
      param: { todoId: '123' },
    });
  });
});
