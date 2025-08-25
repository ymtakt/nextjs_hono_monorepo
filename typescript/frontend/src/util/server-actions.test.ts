/**
 * server-actions.ts のテスト
 *
 * テスト観点（Utility層）:
 * - withServerActionHandling: Server Actionの成功・エラー状態に応じてコールバック実行・トースト表示が正しく動作するか
 * - extractZodErrorMessage: ZodErrorから最初のエラーメッセージを正しく抽出できるか
 * - convertValidationErrors: エラーコードを表示用メッセージに変換し、存在しないコードには適切なフォールバックを提供するか
 * - getFirstValidationErrorMessage: 複数フィールドのエラーから指定順序で最初のメッセージを取得できるか
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import type { ActionState } from '@/util/server-actions';
import {
  ACTION_STATUS,
  convertValidationErrors,
  extractZodErrorMessage,
  getFirstValidationErrorMessage,
  withServerActionHandling,
} from '@/util/server-actions';

// useToastを完全にモック化
const mockSuccess = vi.fn();
const mockError = vi.fn();

vi.mock('@/util/hook/useToast', () => ({
  useToast: vi.fn(() => ({
    success: mockSuccess,
    error: mockError,
  })),
}));

describe('withServerActionHandling', () => {
  const mockOnSuccess = vi.fn();

  const initialState: ActionState = {
    status: ACTION_STATUS.IDLE,
    error: null,
    validationErrors: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 前提：Server Actionが成功ステータスを返す
  // 期待値：onSuccessコールバックが呼ばれ、初期状態が返される
  it('成功時にコールバックが実行され初期状態が返される', async () => {
    // Arrange: モックを定義
    const mockServerAction = vi.fn().mockResolvedValue({
      status: ACTION_STATUS.SUCCESS,
      error: null,
      validationErrors: null,
    });

    // テスト対象の関数を定義
    const wrappedAction = withServerActionHandling(mockServerAction, {
      onSuccess: mockOnSuccess,
      initialState,
    });

    // テスト対象の関数を実行
    const formData = new FormData();

    // Act: テスト対象の関数を実行
    const result = await wrappedAction(initialState, formData);

    // Assert: 検証
    // onSuccessコールバックが正しいパラメータで呼び出されたかどうか
    expect(mockOnSuccess).toHaveBeenCalledWith({ success: mockSuccess });
    // 初期状態が返されているかどうか
    expect(result).toEqual(initialState);
  });

  // 前提：Server Actionがバリデーションエラーステータスを返す
  // 期待値：エラートーストが表示され、エラー状態が返される
  it('バリデーションエラー時にエラートーストが表示される', async () => {
    const errorState = {
      status: ACTION_STATUS.VALIDATION_ERROR,
      error: 'バリデーションエラーが発生しました',
      validationErrors: { title: ['タイトルは必須です'] },
    };

    // モックを定義
    const mockServerAction = vi.fn().mockResolvedValue(errorState);

    // テスト対象の関数を定義
    const wrappedAction = withServerActionHandling(mockServerAction, {
      onSuccess: mockOnSuccess,
      initialState,
    });

    // テスト対象の関数を実行
    const formData = new FormData();

    // テスト対象の関数を実行
    const result = await wrappedAction(initialState, formData);

    // エラートーストが正しいメッセージで表示されたかどうか
    expect(mockError).toHaveBeenCalledWith('バリデーションエラーが発生しました');
    // エラー状態が返されているかどうか
    expect(result).toEqual(errorState);
    // onSuccessコールバックが呼び出されていないかどうか
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  // 前提：Server Actionがサーバーエラーステータスを返す
  // 期待値：エラートーストが表示され、エラー状態が返される
  it('サーバーエラー時にエラートーストが表示される', async () => {
    const errorState = {
      status: ACTION_STATUS.SERVER_ERROR,
      error: 'サーバーエラーが発生しました',
      validationErrors: null,
    };

    // モックを定義
    const mockServerAction = vi.fn().mockResolvedValue(errorState);

    // テスト対象の関数を定義
    const wrappedAction = withServerActionHandling(mockServerAction, {
      onSuccess: mockOnSuccess,
      initialState,
    });

    // テスト対象の関数を実行
    const formData = new FormData();

    // テスト対象の関数を実行
    const result = await wrappedAction(initialState, formData);

    // エラートーストが正しいメッセージで表示されたかどうか
    expect(mockError).toHaveBeenCalledWith('サーバーエラーが発生しました');
    // エラー状態が返されているかどうか
    expect(result).toEqual(errorState);
    // onSuccessコールバックが呼び出されていないかどうか
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  // 前提：Server Actionが予期しないステータスを返す
  // 期待値：そのまま結果が返され、トーストやコールバックは実行されない
  it('予期しないステータス時は結果をそのまま返す', async () => {
    const unknownState = {
      status: 'unknown_status' as const,
      error: null,
      validationErrors: null,
    };

    // モックを定義
    const mockServerAction = vi.fn().mockResolvedValue(unknownState);

    // テスト対象の関数を定義
    const wrappedAction = withServerActionHandling(mockServerAction, {
      onSuccess: mockOnSuccess,
      initialState,
    });

    // テスト対象の関数を実行
    const formData = new FormData();

    // テスト対象の関数を実行
    const result = await wrappedAction(initialState, formData);

    // 予期しない状態がそのまま返されているかどうか
    expect(result).toEqual(unknownState);
    // エラートーストが呼び出されていないかどうか
    expect(mockError).not.toHaveBeenCalled();
    // 成功トーストが呼び出されていないかどうか
    expect(mockSuccess).not.toHaveBeenCalled();
    // onSuccessコールバックが呼び出されていないかどうか
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
describe('extractZodErrorMessage関数のテスト', () => {
  // 前提：複数フィールドにエラーがあるZodErrorが渡される
  // 期待値：最初のエラーメッセージが返される
  it('複数フィールドにエラーがあるZodErrorが渡される', () => {
    const error = new ZodError([
      {
        code: 'custom',
        message: 'titleエラーが発生しました',
        path: ['title'],
      },
      {
        code: 'custom',
        message: 'descriptionエラーが発生しました',
        path: ['description'],
      },
    ]);

    // テスト対象の関数を実行
    // 最初のエラーメッセージが返されているかどうか
    expect(extractZodErrorMessage(error)).toBe('titleエラーが発生しました');
  });

  // 前提：エラーメッセージが空のZodErrorが渡される
  // 期待値：デフォルトメッセージ「バリデーションエラー」が返される
  it('エラーメッセージが空のZodErrorが渡される', () => {
    // モックを定義
    const error = new ZodError([]);

    // テスト対象の関数を実行
    // デフォルトメッセージが返されているかどうか
    expect(extractZodErrorMessage(error)).toBe('バリデーションエラー');
  });

  // 前提：複数のエラーメッセージがある単一フィールドのZodErrorが渡される
  // 期待値：最初のエラーメッセージが返される
  it('複数のエラーメッセージがある単一フィールドのZodErrorが渡される', () => {
    const error = new ZodError([
      {
        code: 'custom',
        message: '最初のエラー',
        path: ['title'],
      },
      {
        code: 'custom',
        message: '二番目のエラー',
        path: ['title'], // 同じフィールド
      },
    ]);

    // テスト対象の関数を実行
    // 最初のエラーメッセージが返されているかどうか
    expect(extractZodErrorMessage(error)).toBe('最初のエラー');
  });
});

describe('convertValidationErrors関数のテスト', () => {
  // 前提：有効なフィールドエラーとメッセージマップが渡される
  // 期待値：エラーコードが表示用メッセージに変換される
  it('有効なフィールドエラーとメッセージマップが渡される', () => {
    const fieldErrors = {
      title: ['REQUIRED_TITLE'],
      description: ['REQUIRED_DESCRIPTION'],
    };
    const messageMap = {
      REQUIRED_TITLE: 'タイトルは必須です',
      REQUIRED_DESCRIPTION: '説明は必須です',
    };
    const validFields = ['title', 'description'] as const;

    // テスト対象の関数を実行
    // エラーコードが表示用メッセージに変換されているかどうか
    expect(convertValidationErrors(fieldErrors, messageMap, validFields)).toEqual({
      title: ['タイトルは必須です'],
      description: ['説明は必須です'],
    });
  });

  // 前提：存在しないエラーコードを含むフィールドエラーが渡される
  // 期待値：デフォルトメッセージ「エラーが発生しました」が使用される
  it('存在しないエラーコードを含むフィールドエラーが渡される', () => {
    const fieldErrors = {
      title: ['UNKNOWN_ERROR'], // messageMapに存在しないコード
    };
    const messageMap = {
      REQUIRED_TITLE: 'タイトルは必須です', // UNKNOWN_ERRORは定義されていない
    };
    const validFields = ['title'] as const;

    // テスト対象の関数を実行
    // 未知のエラーコードがデフォルトメッセージに変換されているかどうか
    expect(convertValidationErrors(fieldErrors, messageMap, validFields)).toEqual({
      title: ['エラーが発生しました'], // デフォルトメッセージが使用される
    });
  });

  // 前提：空のフィールドエラーが渡される
  // 期待値：空のオブジェクトが返される
  it('空のフィールドエラーが渡される', () => {
    const fieldErrors = {};
    const messageMap = {
      REQUIRED_TITLE: 'タイトルは必須です',
      REQUIRED_DESCRIPTION: '説明は必須です',
    };
    const validFields = ['title', 'description'] as const;

    // テスト対象の関数を実行
    // 空のオブジェクトが返されているかどうか
    expect(convertValidationErrors(fieldErrors, messageMap, validFields)).toEqual({});
  });
});

describe('getFirstValidationErrorMessage関数のテスト', () => {
  // 前提：複数フィールドにエラーがあり、フィールド順序が指定される
  // 期待値：指定順序で最初のフィールドのエラーメッセージが返される
  it('複数フィールドにエラーがあり、フィールド順序で最初のエラーが返される', () => {
    const validationErrors = {
      title: ['タイトルは必須です'],
      description: ['説明は必須です'],
    };
    const fieldOrder = ['description', 'title'] as const; // descriptionを先にチェック

    // テスト対象の関数を実行
    // 指定順序の最初のフィールドのエラーメッセージが返されているかどうか
    expect(getFirstValidationErrorMessage(validationErrors, fieldOrder)).toBe('説明は必須です');
  });

  // 前提：エラーがないvalidationErrorsが渡される
  // 期待値：デフォルトメッセージ「入力内容を確認してください」が返される
  it('エラーがない場合デフォルトメッセージが返される', () => {
    const validationErrors = {} as Record<string, string[]>;
    const fieldOrder = ['title', 'description'] as const;

    // テスト対象の関数を実行
    // デフォルトメッセージが返されているかどうか
    expect(getFirstValidationErrorMessage(validationErrors, fieldOrder)).toBe(
      '入力内容を確認してください',
    );
  });

  // 前提：空配列のエラーメッセージを持つフィールドがある
  // 期待値：そのフィールドはスキップされ次のフィールドのエラーメッセージが返される
  it('空配列のフィールドはスキップされる', () => {
    const validationErrors = {
      title: [], // 空配列
      description: ['説明は必須です'],
    };
    const fieldOrder = ['title', 'description'] as const;

    // テスト対象の関数を実行
    // 空配列のフィールドがスキップされて次のフィールドのメッセージが返されているかどうか
    expect(getFirstValidationErrorMessage(validationErrors, fieldOrder)).toBe('説明は必須です');
  });
});
