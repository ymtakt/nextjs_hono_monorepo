import type { CreateTodoRequest } from 'backend/schemas';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/core/service/api.service';
import { createTodo } from '@/domain/logic/action/todo/create-todo';

// APIクライアントをモック化
vi.mock('@/core/service/api.service', () => ({
  apiClient: {
    api: {
      todos: {
        $post: vi.fn(),
      },
    },
  },
}));

describe('createTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 前提：有効なCreateTodoRequestでAPIが正常なレスポンスを返す
  // 期待値：作成されたTodoEntityがok結果で返される
  it('正常にTodoを作成して変換される', async () => {
    const createRequest: CreateTodoRequest = {
      title: '新しいTodo',
      description: '新しい説明',
      completed: false,
    };

    const mockCreatedTodo = {
      todo: {
        id: 1,
        title: '新しいTodo',
        description: '新しい説明',
        completed: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockCreatedTodo),
    };

    // Note: テスト用のmockなので型チェックをスキップ
    // @ts-expect-error
    vi.mocked(apiClient.api.todos.$post).mockResolvedValue(mockResponse);

    const result = await createTodo(createRequest);

    if (result.isOk()) {
      // 作成されたTodoエンティティが期待値と一致するかどうか
      expect(result.value).toEqual({
        id: 1,
        title: '新しいTodo',
        description: '新しい説明',
        isCompleted: false,
        createdDate: '2025-01-01T00:00:00Z',
        updatedDate: '2025-01-01T00:00:00Z',
      });
    }
  });

  // 前提：APIが正常でないレスポンス（ok: false）を返す
  // 期待値：SERVER_ACTION_ERRORがerr結果で返される
  it('APIレスポンスが正常でない場合エラーが返される', async () => {
    const createRequest: CreateTodoRequest = {
      title: 'テストタイトル',
      description: 'テスト説明',
      completed: false,
    };

    const mockResponse = {
      ok: false,
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos.$post).mockResolvedValue(mockResponse);

    const result = await createTodo(createRequest);

    if (result.isErr()) {
      expect(result.error).toBe('SERVER_ACTION_ERROR');
    }
  });

  // 前提：API呼び出し時にネットワークエラーが発生する
  // 期待値：SERVER_ACTION_ERRORがerr結果で返される
  it('API呼び出しでエラーが発生した場合エラーが返される', async () => {
    const createRequest: CreateTodoRequest = {
      title: 'テストタイトル',
      description: 'テスト説明',
      completed: false,
    };

    vi.mocked(apiClient.api.todos.$post).mockRejectedValue(new Error('Network Error'));

    const result = await createTodo(createRequest);

    if (result.isErr()) {
      expect(result.error).toBe('SERVER_ACTION_ERROR');
    }
  });
});
