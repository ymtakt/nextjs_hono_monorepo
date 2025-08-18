import {
  ACTION_STATUS,
  type ActionState,
  type FormFields,
  type ValidationErrors,
} from './server-actions';

/**
 * フォームアクション用の初期状態作成のヘルパー関数
 *
 * @returns 標準的な初期状態
 */
export function createInitialFormActionState<
  T extends FormFields = FormFields,
  U extends ValidationErrors = ValidationErrors,
>(): ActionState<T, U> {
  return {
    status: ACTION_STATUS.IDLE,
    error: null,
    validationErrors: null,
  } as ActionState<T, U>;
}
