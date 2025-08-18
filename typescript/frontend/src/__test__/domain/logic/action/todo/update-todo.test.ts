import type { UpdateTodoRequest } from 'backend/schemas';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/core/service/api.service';
import { updateTodo } from '@/domain/logic/action/todo/update-todo';

// APIクライアントをモック化
vi.mock('@/core/service/api.service', () => ({
  apiClient: {
    api: {
      todos: {
        ':todoId': {
          $put: vi.fn(),
        },
      },
    },
  },
}));

describe('updateTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 前提：有効なtodoIdとUpdateTodoRequestでAPIが正常なレスポンスを返す
  // 期待値：更新されたTodoEntityがok結果で返される
  it('正常にTodoを更新して変換される', async () => {
    const todoId = 1;
    const updateRequest: UpdateTodoRequest = {
      title: '更新されたTodo',
      description: '更新された説明',
      completed: true,
    };

    const mockUpdatedTodo = {
      todo: {
        id: 1,
        title: '更新されたTodo',
        description: '更新された説明',
        completed: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      },
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockUpdatedTodo),
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$put).mockResolvedValue(mockResponse);

    // テスト対象の関数を実行
    const result = await updateTodo(todoId, updateRequest);

    // 期待値の確認
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      // データの確認
      expect(result.value).toEqual({
        id: 1,
        title: '更新されたTodo',
        description: '更新された説明',
        isCompleted: true,
        createdDate: '2025-01-01T00:00:00Z',
        updatedDate: '2025-01-02T00:00:00Z',
      });
    }
  });

  // 前提：todoIdとUpdateTodoRequestが正しくAPIに渡される
  // 期待値：paramとjsonが適切にAPIに送信される
  it('todoIdとUpdateTodoRequestが正しくAPIに渡される', async () => {
    const todoId = 123;
    const updateRequest: UpdateTodoRequest = {
      title: 'テストタイトル',
      description: 'テスト説明',
      completed: false,
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        todo: {
          id: 123,
          title: 'テストタイトル',
          description: 'テスト説明',
          completed: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      }),
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$put).mockResolvedValue(mockResponse);

    // テスト対象の関数を実行
    await updateTodo(todoId, updateRequest);

    // モックの呼び出し確認
    expect(apiClient.api.todos[':todoId'].$put).toHaveBeenCalledWith({
      param: { todoId: '123' },
      json: {
        title: 'テストタイトル',
        description: 'テスト説明',
        completed: false,
      },
    });
  });

  // 前提：全フィールドを含むUpdateTodoRequestが渡される
  // 期待値：更新が正常に処理される
  it('全フィールドを含む更新リクエストが正常に処理される', async () => {
    const todoId = 1;
    const updateRequest: UpdateTodoRequest = {
      title: '既存のタイトル',
      description: '既存の説明',
      completed: true,
    };

    const mockUpdatedTodo = {
      todo: {
        id: 1,
        title: '既存のタイトル',
        description: '既存の説明',
        completed: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      },
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockUpdatedTodo),
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$put).mockResolvedValue(mockResponse);

    // テスト対象の関数を実行
    const result = await updateTodo(todoId, updateRequest);

    // 期待値の確認
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      // データの確認
      expect(result.value.isCompleted).toBe(true);
    }
    // モックの呼び出し確認
    expect(apiClient.api.todos[':todoId'].$put).toHaveBeenCalledWith({
      param: { todoId: '1' },
      json: {
        title: '既存のタイトル',
        description: '既存の説明',
        completed: true,
      },
    });
  });

  // 前提：todoIdが数値で渡される
  // 期待値：todoIdが文字列に変換されてAPIに渡される
  it('todoIdが文字列に変換されてAPIに渡される', async () => {
    const todoId = 456;
    const updateRequest: UpdateTodoRequest = {
      title: 'テスト',
      description: 'テストの説明',
      completed: false,
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        todo: {
          id: 456,
          title: 'テスト',
          description: 'テストの説明',
          completed: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      }),
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$put).mockResolvedValue(mockResponse);

    // テスト対象の関数を実行
    await updateTodo(todoId, updateRequest);

    // モックの呼び出し確認
    expect(apiClient.api.todos[':todoId'].$put).toHaveBeenCalledWith({
      param: { todoId: '456' },
      json: {
        title: 'テスト',
        description: 'テストの説明',
        completed: false,
      },
    });
  });

  // 前提：APIが正常でないレスポンス（ok: false）を返す
  // 期待値：TODO_UPDATE_FAILEDエラーがerr結果で返される
  it('APIレスポンスが正常でない場合エラーが返される', async () => {
    const todoId = 999;
    const updateRequest: UpdateTodoRequest = {
      title: 'エラーテスト',
      description: 'エラーテストの説明',
      completed: false,
    };

    const mockResponse = {
      ok: false,
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[':todoId'].$put).mockResolvedValue(mockResponse);

    // テスト対象の関数を実行
    const result = await updateTodo(todoId, updateRequest);

    // 期待値の確認
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toEqual({ type: 'TODO_UPDATE_FAILED' });
    }
  });

  // 前提：API呼び出し時にネットワークエラーが発生する
  // 期待値：TODO_UPDATE_FAILEDエラーがerr結果で返される
  it('API呼び出しでエラーが発生した場合エラーが返される', async () => {
    const todoId = 1;
    const updateRequest: UpdateTodoRequest = {
      title: 'エラーテスト',
      description: 'ネットワークエラーテストの説明',
      completed: false,
    };

    vi.mocked(apiClient.api.todos[':todoId'].$put).mockRejectedValue(new Error('Network Error'));

    // テスト対象の関数を実行
    const result = await updateTodo(todoId, updateRequest);

    // 期待値の確認
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toEqual({ type: 'TODO_UPDATE_FAILED' });
    }
  });
});
