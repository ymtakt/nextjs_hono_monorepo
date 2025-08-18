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

import { revalidatePath } from 'next/cache';
// モック関数のインポート
import { createTodo } from '@/domain/logic/action/todo/create-todo';
import { deleteTodo } from '@/domain/logic/action/todo/delete-todo';
import { updateTodo } from '@/domain/logic/action/todo/update-todo';

// テスト用のモックEntity
const mockTodoEntity = {
  id: 1,
  title: 'テストTodo',
  description: 'テストの説明',
  isCompleted: false,
  createdDate: '2025-01-01T00:00:00Z',
  updatedDate: '2025-01-01T00:00:00Z',
};

// FormData作成ヘルパー
const createFormData = (data: Record<string, string | boolean>) => {
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

    // 前提：有効なフォームデータが送信され、use-caseが成功する
    // 期待値：成功状態が返され、revalidatePathが呼ばれる
    it('有効なデータでTodo作成が成功する', async () => {
      const formData = createFormData({
        title: '新しいTodo',
        description: '新しい説明',
        completed: false,
      });

      vi.mocked(createTodo).mockResolvedValue(ok(mockTodoEntity));

      const result = await createTodoAction(initialState, formData);

      // 結果が成功状態であるかどうか
      expect(result).toEqual({
        status: ACTION_STATUS.SUCCESS,
        error: null,
        validationErrors: null,
      });

      // createTodoが正しいパラメータで呼び出されたかどうか
      expect(createTodo).toHaveBeenCalledWith({
        title: '新しいTodo',
        description: '新しい説明',
        completed: false,
      });

      // ルートパスがrevalidateされたかどうか
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

      // ステータスがバリデーションエラーであるかどうか
      expect(result.status).toBe(ACTION_STATUS.VALIDATION_ERROR);
      // エラーメッセージが期待値と一致するかどうか
      expect(result.error).toBe('タイトルは必須です');
      // titleのバリデーションエラーが設定されているかどうか
      expect(result.validationErrors?.title).toEqual(['タイトルは必須です']);
      // 入力されたtitleが保持されているかどうか
      expect(result.title).toBe('');
      // 入力されたdescriptionが保持されているかどうか
      expect(result.description).toBe('説明');

      // createTodoが呼び出されていないかどうか
      expect(createTodo).not.toHaveBeenCalled();
      // revalidatePathが呼び出されていないかどうか
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    // 前提：titleが100文字を超えるフォームデータが送信される
    // 期待値：バリデーションエラー状態が返される
    it('titleが100文字を超える場合バリデーションエラーが返される', async () => {
      const longTitle = 'a'.repeat(101);
      const formData = createFormData({
        title: longTitle,
        description: '説明',
        completed: false,
      });

      const result = await createTodoAction(initialState, formData);

      // ステータスがバリデーションエラーであるかどうか
      expect(result.status).toBe(ACTION_STATUS.VALIDATION_ERROR);
      // エラーメッセージが期待値と一致するかどうか
      expect(result.error).toBe('タイトルは100文字以内で入力してください');
      // titleのバリデーションエラーが設定されているかどうか
      expect(result.validationErrors?.title).toEqual(['タイトルは100文字以内で入力してください']);
    });

    // 前提：descriptionが空のフォームデータが送信される
    // 期待値：バリデーションエラー状態が返される
    it('descriptionが空の場合バリデーションエラーが返される', async () => {
      const formData = createFormData({
        title: 'タイトル',
        description: '',
        completed: false,
      });

      const result = await createTodoAction(initialState, formData);

      // ステータスがバリデーションエラーであるかどうか
      expect(result.status).toBe(ACTION_STATUS.VALIDATION_ERROR);
      // エラーメッセージが期待値と一致するかどうか
      expect(result.error).toBe('説明を入力してください');
      // descriptionのバリデーションエラーが設定されているかどうか
      expect(result.validationErrors?.description).toEqual(['説明を入力してください']);
    });

    // 前提：有効なデータだがuse-caseがエラーを返す
    // 期待値：サーバーエラー状態が返され、入力値が保持される
    it('use-caseでエラーが発生した場合サーバーエラーが返される', async () => {
      const formData = createFormData({
        title: 'タイトル',
        description: '説明',
        completed: false,
      });

      vi.mocked(createTodo).mockResolvedValue(err({ type: 'TODO_CREATE_FAILED' }));

      const result = await createTodoAction(initialState, formData);

      // ステータスがサーバーエラーであるかどうか
      expect(result.status).toBe(ACTION_STATUS.SERVER_ERROR);
      // エラーメッセージが期待値と一致するかどうか
      expect(result.error).toBe('Todoの作成に失敗しました');
      // バリデーションエラーがnullであるかどうか
      expect(result.validationErrors).toBe(null);
      // 入力されたtitleが保持されているかどうか
      expect(result.title).toBe('タイトル');
      // 入力されたdescriptionが保持されているかどうか
      expect(result.description).toBe('説明');

      // revalidatePathが呼び出されていないかどうか
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    // 前提：completedがチェックされたフォームデータが送信される
    // 期待値：completedがtrueでuse-caseが呼ばれる
    it('completedがチェックされている場合trueで処理される', async () => {
      const formData = createFormData({
        title: 'タイトル',
        description: '説明',
        completed: true,
      });

      vi.mocked(createTodo).mockResolvedValue(ok(mockTodoEntity));

      await createTodoAction(initialState, formData);

      // createTodoがcompletedをtrueで呼び出されたかどうか
      expect(createTodo).toHaveBeenCalledWith({
        title: 'タイトル',
        description: '説明',
        completed: true,
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
      const formData = createFormData({
        todoId: '123',
        title: '更新されたTodo',
        description: '更新された説明',
        completed: true,
      });

      vi.mocked(updateTodo).mockResolvedValue(ok(mockTodoEntity));

      const result = await updateTodoAction(initialState, formData);

      // 結果が成功状態であるかどうか
      expect(result).toEqual({
        status: ACTION_STATUS.SUCCESS,
        error: null,
        validationErrors: null,
      });

      // updateTodoが正しいパラメータで呼び出されたかどうか
      expect(updateTodo).toHaveBeenCalledWith(123, {
        title: '更新されたTodo',
        description: '更新された説明',
        completed: true,
      });

      // ルートパスがrevalidateされたかどうか
      expect(revalidatePath).toHaveBeenCalledWith('/');
      // 編集ページのパスがrevalidateされたかどうか
      expect(revalidatePath).toHaveBeenCalledWith('/edit/123');
    });

    // 前提：todoIdが含まれていないフォームデータが送信される
    // 期待値：バリデーションエラー状態が返される
    it('todoIdが存在しない場合エラーが返される', async () => {
      const formData = createFormData({
        title: 'タイトル',
        description: '説明',
        completed: false,
      });

      const result = await updateTodoAction(initialState, formData);

      // ステータスがバリデーションエラーであるかどうか
      expect(result.status).toBe(ACTION_STATUS.VALIDATION_ERROR);
      // エラーメッセージが期待値と一致するかどうか
      expect(result.error).toBe('TodoIDが見つかりません');
      // バリデーションエラーがnullであるかどうか
      expect(result.validationErrors).toBe(null);

      // updateTodoが呼び出されていないかどうか
      expect(updateTodo).not.toHaveBeenCalled();
      // revalidatePathが呼び出されていないかどうか
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    // 前提：有効なtodoIdだが無効なフォームデータが送信される
    // 期待値：バリデーションエラー状態が返される
    it('バリデーションエラーがある場合エラー状態が返される', async () => {
      const formData = createFormData({
        todoId: '123',
        title: '',
        description: '説明',
        completed: false,
      });

      const result = await updateTodoAction(initialState, formData);

      // ステータスがバリデーションエラーであるかどうか
      expect(result.status).toBe(ACTION_STATUS.VALIDATION_ERROR);
      // エラーメッセージが期待値と一致するかどうか
      expect(result.error).toBe('タイトルは必須です');
      // titleのバリデーションエラーが設定されているかどうか
      expect(result.validationErrors?.title).toEqual(['タイトルは必須です']);

      // updateTodoが呼び出されていないかどうか
      expect(updateTodo).not.toHaveBeenCalled();
    });

    // 前提：有効なデータだがuse-caseがエラーを返す
    // 期待値：サーバーエラー状態が返される
    it('use-caseでエラーが発生した場合サーバーエラーが返される', async () => {
      const formData = createFormData({
        todoId: '123',
        title: 'タイトル',
        description: '説明',
        completed: false,
      });

      vi.mocked(updateTodo).mockResolvedValue(err({ type: 'TODO_UPDATE_FAILED' }));

      const result = await updateTodoAction(initialState, formData);

      // ステータスがサーバーエラーであるかどうか
      expect(result.status).toBe(ACTION_STATUS.SERVER_ERROR);
      // エラーメッセージが期待値と一致するかどうか
      expect(result.error).toBe('Todoの更新に失敗しました');
      // バリデーションエラーがnullであるかどうか
      expect(result.validationErrors).toBe(null);

      // revalidatePathが呼び出されていないかどうか
      expect(revalidatePath).not.toHaveBeenCalled();
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

      // 結果が成功状態であるかどうか
      expect(result).toEqual({
        status: ACTION_STATUS.SUCCESS,
        error: null,
        validationErrors: null,
      });

      // deleteTodoが正しいIDで呼び出されたかどうか
      expect(deleteTodo).toHaveBeenCalledWith(123);
      // ルートパスがrevalidateされたかどうか
      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    // 前提：todoIdが含まれていないフォームデータが送信される
    // 期待値：サーバーエラー状態が返される
    it('todoIdが存在しない場合エラーが返される', async () => {
      const formData = new FormData();

      const result = await deleteTodoAction(initialState, formData);

      // ステータスがサーバーエラーであるかどうか
      expect(result.status).toBe(ACTION_STATUS.SERVER_ERROR);
      // エラーメッセージが期待値と一致するかどうか
      expect(result.error).toBe('TodoIDが見つかりません');
      // バリデーションエラーがnullであるかどうか
      expect(result.validationErrors).toBe(null);

      // deleteTodoが呼び出されていないかどうか
      expect(deleteTodo).not.toHaveBeenCalled();
      // revalidatePathが呼び出されていないかどうか
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    // 前提：有効なtodoIdだがuse-caseがエラーを返す
    // 期待値：サーバーエラー状態が返される
    it('use-caseでエラーが発生した場合サーバーエラーが返される', async () => {
      const formData = createFormData({
        todoId: '123',
      });

      vi.mocked(deleteTodo).mockResolvedValue(err({ type: 'TODO_DELETE_FAILED' }));

      const result = await deleteTodoAction(initialState, formData);

      // ステータスがサーバーエラーであるかどうか
      expect(result.status).toBe(ACTION_STATUS.SERVER_ERROR);
      // エラーメッセージが期待値と一致するかどうか
      expect(result.error).toBe('Todoの削除に失敗しました');
      // バリデーションエラーがnullであるかどうか
      expect(result.validationErrors).toBe(null);

      // revalidatePathが呼び出されていないかどうか
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});
