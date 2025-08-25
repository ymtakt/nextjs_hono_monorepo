import { err, ok } from 'neverthrow';
import { revalidatePath } from 'next/cache';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTodoAction,
  type DeleteTodoActionState,
  deleteTodoAction,
  type TodoFormActionState,
  updateTodoAction,
} from '@/component/client-page/todo/action';
import { apiClient } from '@/core/service/api.service';
import { ACTION_STATUS } from '@/util/server-actions';

// Next.js revalidatePathをモック
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// // Domain layer use-casesをモック
// vi.mock('@/domain/logic/action/todo/create-todo', () => ({
//   createTodo: vi.fn(),
// }));

// vi.mock('@/domain/logic/action/todo/update-todo', () => ({
//   updateTodo: vi.fn(),
// }));

// vi.mock('@/domain/logic/action/todo/delete-todo', () => ({
//   deleteTodo: vi.fn(),
// }));

// APIクライアントをモック化
vi.mock('@/core/service/api.service', () => ({
  apiClient: {
    api: {
      todos: {
        $post: vi.fn(),
        ':todoId': {
          $put: vi.fn(),
          $delete: vi.fn(),
        },
      },
    },
  },
}));

/**
 * Server Actionで使用するFormDataを作成する
 *
 * @param data - フォームデータ
 * @returns FormData
 */
const createFormData = (data: Record<string, string | boolean>): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      formData.append(key, value ? 'on' : 'off');
    } else {
      formData.append(key, value);
    }
  });
  return formData;
};

describe('Todo Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTodoAction', () => {
    const initialState: TodoFormActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    };
    // 前提：有効なフォームデータが送信され、createTodoが成功する
    // 期待値：成功状態が返され、revalidatePathが呼ばれる
    it('有効なデータでTodo作成が成功する', async () => {
      // Arrange: 有効なフォームデータを作成する
      const formData = createFormData({
        title: '新しいTodo',
        description: '新しい説明',
        completed: false,
      });

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

      // Act: createTodoActionを実行する
      const result = await createTodoAction(initialState, formData);

      // Assert: 成功状態が返され、revalidatePathが呼ばれることを確認する
      expect(result).toEqual({
        status: ACTION_STATUS.SUCCESS,
        error: null,
        validationErrors: null,
      });

      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    // 前提：titleが空のフォームデータが送信される
    // 期待値：バリデーションエラー状態が返され、入力値が保持される
    it('titleが空の場合バリデーションエラーが返される', async () => {
      // Arrange: 空のtitleを含むフォームデータを作成する
      const formData = createFormData({
        title: '',
        description: '説明',
        completed: false,
      });

      // Act: createTodoActionを実行する
      const result = await createTodoAction(initialState, formData);

      // Assert: バリデーションエラー状態が返され、入力値が保持されることを確認する
      expect(result).toEqual({
        status: ACTION_STATUS.VALIDATION_ERROR,
        error: 'タイトルは必須です',
        validationErrors: { title: ['タイトルは必須です'] },
        title: '',
        description: '説明',
        completed: false,
      });
    });

    // 前提：有効なデータだがcreateTodoがエラーを返す
    // 期待値：サーバーエラー状態が返され、入力値が保持される
    it('createTodoでエラーが発生した場合サーバーエラーが返される', async () => {
      // Arrange: 有効なフォームデータを作成する
      const formData = createFormData({
        title: 'タイトル',
        description: '説明',
        completed: false,
      });

      vi.mocked(apiClient.api.todos.$post).mockRejectedValue(new Error('Network Error'));

      // Act: createTodoActionを実行する
      const result = await createTodoAction(initialState, formData);

      // Assert: サーバーエラー状態が返され、入力値が保持されることを確認する
      expect(result).toEqual({
        status: ACTION_STATUS.SERVER_ERROR,
        error: 'Todoの作成に失敗しました',
        validationErrors: null,
        title: 'タイトル',
        description: '説明',
        completed: false,
      });
    });
  });

  describe('updateTodoAction', () => {
    const initialState: TodoFormActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    };

    // 前提：有効なtodoIdと有効なフォームデータが送信される
    // 期待値：成功状態が返され、複数のrevalidatePathが呼ばれる
    it('有効なデータでTodo更新が成功する', async () => {
      // Arrange: 有効なフォームデータを作成する
      const formData = createFormData({
        todoId: '123',
        title: '更新されたTodo',
        description: '更新された説明',
        completed: true,
      });

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

      // Act: updateTodoActionを実行する
      const result = await updateTodoAction(initialState, formData);

      // Assert: 成功状態が返され、複数のrevalidatePathが呼ばれることを確認する
      expect(result).toEqual({
        status: ACTION_STATUS.SUCCESS,
        error: null,
        validationErrors: null,
      });

      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(revalidatePath).toHaveBeenCalledWith('/edit/123');
    });

    // 前提：todoIdが含まれていないフォームデータが送信される
    // 期待値：バリデーションエラー状態が返され、入力値が保持される
    it('todoIdが存在しない場合エラーが返される', async () => {
      // Arrange: 空のtodoIdを含むフォームデータを作成する
      const formData = createFormData({
        title: 'タイトル',
        description: '説明',
        completed: false,
      });

      // Act: updateTodoActionを実行する
      const result = await updateTodoAction(initialState, formData);

      // Assert: バリデーションエラー状態が返され、入力値が保持されることを確認する
      expect(result).toEqual({
        status: ACTION_STATUS.VALIDATION_ERROR,
        error: 'TodoIDが見つかりません',
        validationErrors: null,
        title: undefined,
        description: undefined,
      });
    });

    // 前提：有効なtodoIdだが無効なフォームデータが送信される
    // 期待値：バリデーションエラー状態が返され、入力値が保持される
    it('バリデーションエラーがある場合エラー状態が返される', async () => {
      // Arrange: 空のtitleを含むフォームデータを作成する
      const formData = createFormData({
        todoId: '123',
        title: '',
        description: '説明',
        completed: false,
      });

      // Act: updateTodoActionを実行する
      const result = await updateTodoAction(initialState, formData);

      // Assert: バリデーションエラー状態が返され、入力値が保持されることを確認する
      expect(result).toEqual({
        status: ACTION_STATUS.VALIDATION_ERROR,
        error: 'タイトルは必須です',
        validationErrors: { title: ['タイトルは必須です'] },
        title: '',
        description: '説明',
        completed: false,
      });
    });

    // 前提：有効なデータだがupdateTodoがエラーを返す
    // 期待値：サーバーエラー状態が返され、入力値が保持される
    it('updateTodoでエラーが発生した場合サーバーエラーが返される', async () => {
      // Arrange: 有効なフォームデータを作成する
      const formData = createFormData({
        todoId: '123',
        title: 'タイトル',
        description: '説明',
        completed: false,
      });

      vi.mocked(apiClient.api.todos[':todoId'].$put).mockRejectedValue(new Error('Network Error'));

      // Act: updateTodoActionを実行する
      const result = await updateTodoAction(initialState, formData);

      // Assert: サーバーエラー状態が返され、入力値が保持されることを確認する
      expect(result).toEqual({
        status: ACTION_STATUS.SERVER_ERROR,
        error: 'Todoの更新に失敗しました',
        validationErrors: null,
        title: 'タイトル',
        description: '説明',
        completed: false,
      });
    });
  });

  describe('deleteTodoAction', () => {
    const initialState: DeleteTodoActionState = {
      status: ACTION_STATUS.IDLE,
      error: null,
      validationErrors: null,
    };

    // 前提：有効なtodoIdが送信される
    // 期待値：成功状態が返され、revalidatePathが呼ばれる
    it('有効なtodoIdでTodo削除が成功する', async () => {
      // Arrange: 有効なフォームデータを作成する
      const formData = createFormData({
        todoId: '123',
      });

      const mockResponse = {
        ok: true,
      };

      // @ts-expect-error テスト用のmockなので型チェックをスキップ
      vi.mocked(apiClient.api.todos[':todoId'].$delete).mockResolvedValue(mockResponse);

      // Act: deleteTodoActionを実行する
      const result = await deleteTodoAction(initialState, formData);

      // Assert: 成功状態が返され、revalidatePathが呼ばれることを確認する
      expect(result).toEqual({
        status: ACTION_STATUS.SUCCESS,
        error: null,
        validationErrors: null,
      });

      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    // 前提：todoIdが含まれていないフォームデータが送信される
    // 期待値：サーバーエラー状態が返される
    it('todoIdが存在しない場合エラーが返される', async () => {
      // Arrange: 空のtodoIdを含むフォームデータを作成する
      const formData = new FormData();

      // Act: deleteTodoActionを実行する
      const result = await deleteTodoAction(initialState, formData);

      // Assert: サーバーエラー状態が返されることを確認する
      expect(result).toEqual({
        status: ACTION_STATUS.SERVER_ERROR,
        error: 'TodoIDが見つかりません',
        validationErrors: null,
        todoId: null,
      });
    });

    // 前提：有効なtodoIdだがdeleteTodoがエラーを返す
    // 期待値：サーバーエラー状態が返される
    it('deleteTodoでエラーが発生した場合サーバーエラーが返される', async () => {
      // Arrange: 有効なフォームデータを作成する
      const formData = createFormData({
        todoId: '123',
      });

      vi.mocked(apiClient.api.todos[':todoId'].$delete).mockRejectedValue(
        new Error('Network Error'),
      );

      // Act: deleteTodoActionを実行する
      const result = await deleteTodoAction(initialState, formData);

      // Assert: サーバーエラー状態が返されることを確認する
      expect(result).toEqual({
        status: ACTION_STATUS.SERVER_ERROR,
        error: 'Todoの削除に失敗しました',
        validationErrors: null,
      });
    });
  });
});
