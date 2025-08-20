'use client';

import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import type { TodoFormActionState } from '@/component/client-page/todo/action';
import { createTodoAction } from '@/component/client-page/todo/action';
import { TodoFormComponent } from '@/component/functionless/todo';

import { createInitialFormActionState } from '@/util/form-action-state';
import { withServerActionHandling } from '@/util/server-actions';

export function TodoRegisterClientPage() {
  const router = useRouter();
  // 初期状態を作成
  const initialState: TodoFormActionState = createInitialFormActionState();
  // Server Actionをラップ
  const wrappedAction = withServerActionHandling(createTodoAction, {
    onSuccess: ({ success }) => {
      success('作成しました');
      router.replace('/');
    },
    initialState,
  });

  /**
   * useActionStateフック
   *
   * Server Actionと状態管理を統合する
   *
   * @param wrappedAction - 実行するアクション関数
   * @param initialState - 初期状態
   * @returns [state, formAction, isPending]
   *
   * 戻り値の説明：
   * - state: 現在のフォーム状態（バリデーションエラー、入力値等を含む）
   * - formAction: フォームのaction属性に渡す関数
   * - isPending: Server Action実行中の場合true（ローディング表示に使用）
   */
  const [state, formAction, isPending] = useActionState<TodoFormActionState, FormData>(
    wrappedAction,
    initialState,
  );

  return (
    <TodoFormComponent
      mode={'create'}
      formActionMethod={formAction}
      titleValue={state.title}
      descriptionValue={state.description}
      completedValue={state.completed}
      titleErrorMessage={
        state.validationErrors?.title?.[0] ? state.validationErrors?.title?.[0] : undefined
      }
      descriptionErrorMessage={
        state.validationErrors?.description?.[0]
          ? state.validationErrors?.description?.[0]
          : undefined
      }
      completedErrorMessage={
        state.validationErrors?.completed?.[0] ? state.validationErrors?.completed?.[0] : undefined
      }
      isPending={isPending}
    />
  );
}
