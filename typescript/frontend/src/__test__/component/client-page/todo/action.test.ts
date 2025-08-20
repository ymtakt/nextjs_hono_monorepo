import { err, ok } from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTodoAction,
  type DeleteTodoActionState,
  deleteTodoAction,
  type TodoFormActionState,
  updateTodoAction,
} from '@/component/client-page/todo/action';
import { ACTION_STATUS } from '@/util/server-actions';
import { revalidatePath } from 'next/cache';
import { createTodo } from '@/domain/logic/action/todo/create-todo';
import { deleteTodo } from '@/domain/logic/action/todo/delete-todo';
import { updateTodo } from '@/domain/logic/action/todo/update-todo';



// Next.js revalidatePathをモック
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Domain layer use-casesをモック
vi.mock('@/domain/logic/action/todo/create-todo', () => ({
  createTodo: vi.fn(),
}));

vi.mock('@/domain/logic/action/todo/update-todo', () => ({
  updateTodo: vi.fn(),
}));

vi.mock('@/domain/logic/action/todo/delete-todo', () => ({
  deleteTodo: vi.fn(),
}));

// テスト用のモックEntity
const mockTodoEntity = {
  id: 1,
  title: 'テストTodo',
  description: 'テストの説明',
  isCompleted: false,
  createdDate: '2025-01-01T00:00:00Z',
  updatedDate: '2025-01-01T00:00:00Z',
};

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
      const formData = createFormData({
        title: '新しいTodo',
        description: '新しい説明',
        completed: false,
      });

      vi.mocked(createTodo).mockResolvedValue(ok(mockTodoEntity));

      const result = await createTodoAction(initialState, formData);

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
      const formData = createFormData({
        title: '',
        description: '説明',
        completed: false,
      });

      const result = await createTodoAction(initialState, formData);

      expect(result.status).toBe(ACTION_STATUS.VALIDATION_ERROR);
      expect(result.error).toBe('タイトルは必須です');
      expect(result.validationErrors?.title).toEqual(['タイトルは必須です']);
      expect(result.title).toBe('');
      expect(result.description).toBe('説明');
    });

    // 前提：有効なデータだがcreateTodoがエラーを返す
    // 期待値：サーバーエラー状態が返され、入力値が保持される
    it('createTodoでエラーが発生した場合サーバーエラーが返される', async () => {
      const formData = createFormData({
        title: 'タイトル',
        description: '説明',
        completed: false,
      });

      vi.mocked(createTodo).mockResolvedValue(err('SERVER_ACTION_ERROR'));

      const result = await createTodoAction(initialState, formData);

      expect(result.status).toBe(ACTION_STATUS.SERVER_ERROR);
      expect(result.error).toBe('Todoの作成に失敗しました');
      expect(result.validationErrors).toBe(null);
      expect(result.title).toBe('タイトル');
      expect(result.description).toBe('説明');
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
      const formData = createFormData({
        todoId: '123',
        title: '更新されたTodo',
        description: '更新された説明',
        completed: true,
      });

      vi.mocked(updateTodo).mockResolvedValue(ok(mockTodoEntity));

      const result = await updateTodoAction(initialState, formData);

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
      const formData = createFormData({
        title: 'タイトル',
        description: '説明',
        completed: false,
      });

      const result = await updateTodoAction(initialState, formData);

      expect(result.status).toBe(ACTION_STATUS.VALIDATION_ERROR);
      expect(result.error).toBe('TodoIDが見つかりません');
      expect(result.validationErrors).toBe(null);
      expect(result.title).toBeUndefined();
      expect(result.description).toBeUndefined();
    });

    // 前提：有効なtodoIdだが無効なフォームデータが送信される
    // 期待値：バリデーションエラー状態が返され、入力値が保持される
    it('バリデーションエラーがある場合エラー状態が返される', async () => {
      const formData = createFormData({
        todoId: '123',
        title: '',
        description: '説明',
        completed: false,
      });

      const result = await updateTodoAction(initialState, formData);

      expect(result.status).toBe(ACTION_STATUS.VALIDATION_ERROR);
      expect(result.error).toBe('タイトルは必須です');
      expect(result.validationErrors?.title).toEqual(['タイトルは必須です']);
      expect(result.title).toBe('');
      expect(result.description).toBe('説明');
      expect(result.completed).toBe(false);
    });

    // 前提：有効なデータだがupdateTodoがエラーを返す
    // 期待値：サーバーエラー状態が返され、入力値が保持される
    it('updateTodoでエラーが発生した場合サーバーエラーが返される', async () => {
      const formData = createFormData({
        todoId: '123',
        title: 'タイトル',
        description: '説明',
        completed: false,
      });

      vi.mocked(updateTodo).mockResolvedValue(err('SERVER_ACTION_ERROR'));

      const result = await updateTodoAction(initialState, formData);

      expect(result.status).toBe(ACTION_STATUS.SERVER_ERROR);
      expect(result.error).toBe('Todoの更新に失敗しました');
      expect(result.validationErrors).toBe(null);
      expect(result.title).toBe('タイトル');
      expect(result.description).toBe('説明');
      expect(result.completed).toBe(false);
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
      const formData = createFormData({
        todoId: '123',
      });

      vi.mocked(deleteTodo).mockResolvedValue(ok(undefined));

      const result = await deleteTodoAction(initialState, formData);

      expect(result).toEqual({
        status: ACTION_STATUS.SUCCESS,
        error: null,
        validationErrors: null,
      });

      expect(deleteTodo).toHaveBeenCalledWith(123);
      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    // 前提：todoIdが含まれていないフォームデータが送信される
    // 期待値：サーバーエラー状態が返される
    it('todoIdが存在しない場合エラーが返される', async () => {
      const formData = new FormData();

      const result = await deleteTodoAction(initialState, formData);

      expect(result.status).toBe(ACTION_STATUS.SERVER_ERROR);
      expect(result.error).toBe('TodoIDが見つかりません');
      expect(result.validationErrors).toBe(null);
    });

    // 前提：有効なtodoIdだがdeleteTodoがエラーを返す
    // 期待値：サーバーエラー状態が返される
    it('deleteTodoでエラーが発生した場合サーバーエラーが返される', async () => {
      const formData = createFormData({
        todoId: '123',
      });

      vi.mocked(deleteTodo).mockResolvedValue(err('SERVER_ACTION_ERROR'));

      const result = await deleteTodoAction(initialState, formData);

      expect(result.status).toBe(ACTION_STATUS.SERVER_ERROR);
      expect(result.error).toBe('Todoの削除に失敗しました');
      expect(result.validationErrors).toBe(null);
    });
  });
});