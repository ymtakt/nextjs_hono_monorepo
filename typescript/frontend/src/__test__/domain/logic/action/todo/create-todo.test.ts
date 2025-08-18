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

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos.$post).mockResolvedValue(mockResponse);

    // テスト対象の関数を実行
    const result = await createTodo(createRequest);

    // 期待値の確認
    expect(result.isOk()).toBe(true);
    // 成功時のデータの確認
    if (result.isOk()) {
      // データの確認
      expect(result.value).toEqual({
        id: 1,
        title: '新しいTodo',
        description: '新しい説明',
        isCompleted: false,
        createdDate: '2025-01-01T00:00:00Z',
        updatedDate: '2025-01-01T00:00:00Z',
      });
    }
    // モックの呼び出し確認
    expect(apiClient.api.todos.$post).toHaveBeenCalledWith({
      json: createRequest,
    });
  });

  // 前提：CreateTodoRequestがJSONとして正しくAPIに渡される
  // 期待値：リクエストボディにCreateTodoRequestが含まれる
  it('CreateTodoRequestがJSONとしてAPIに渡される', async () => {
    const createRequest: CreateTodoRequest = {
      title: 'テストタイトル',
      description: 'テスト説明',
      completed: false,
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        todo: {
          id: 1,
          title: 'テストタイトル',
          description: 'テスト説明',
          completed: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      }),
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos.$post).mockResolvedValue(mockResponse);

    // テスト対象の関数を実行
    await createTodo(createRequest);

    // モックの呼び出し確認
    expect(apiClient.api.todos.$post).toHaveBeenCalledWith({
      json: {
        title: 'テストタイトル',
        description: 'テスト説明',
        completed: false,
      },
    });
  });

  // 前提：APIが正常でないレスポンス（ok: false）を返す
  // 期待値：TODO_CREATE_FAILEDエラーがerr結果で返される
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

    // テスト対象の関数を実行
    const result = await createTodo(createRequest);

    // 期待値の確認
    expect(result.isErr()).toBe(true);
    // エラー時のデータの確認
    if (result.isErr()) {
      // エラーの内容が正しいか確認
      expect(result.error).toEqual({ type: 'TODO_CREATE_FAILED' });
    }
  });

  // 前提：API呼び出し時にネットワークエラーが発生する
  // 期待値：TODO_CREATE_FAILEDエラーがerr結果で返される
  it('API呼び出しでエラーが発生した場合エラーが返される', async () => {
    const createRequest: CreateTodoRequest = {
      title: 'テストタイトル',
      description: 'テスト説明',
      completed: false,
    };

    // モックを設定
    vi.mocked(apiClient.api.todos.$post).mockRejectedValue(new Error('Network Error'));

    // テスト対象の関数を実行
    const result = await createTodo(createRequest);

    // 期待値の確認
    expect(result.isErr()).toBe(true);
    // エラー時のデータの確認
    if (result.isErr()) {
      // エラーの内容が正しいか確認
      expect(result.error).toEqual({ type: 'TODO_CREATE_FAILED' });
    }
  });

  // 前提：空のdescriptionを持つCreateTodoRequestが渡される
  // 期待値：空のdescriptionでもTodoが正常に作成される
  it('空のdescriptionでもTodoが作成される', async () => {
    const createRequest: CreateTodoRequest = {
      title: 'タイトルのみ',
      description: '',
      completed: false,
    };

    const mockCreatedTodo = {
      todo: {
        id: 2,
        title: 'タイトルのみ',
        description: '',
        completed: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockCreatedTodo),
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos.$post).mockResolvedValue(mockResponse);

    // テスト対象の関数を実行
    const result = await createTodo(createRequest);

    // 期待値の確認
    expect(result.isOk()).toBe(true);
    // 成功時のデータの確認
    if (result.isOk()) {
      // データの確認
      expect(result.value.description).toBe('');
    }
  });
});
