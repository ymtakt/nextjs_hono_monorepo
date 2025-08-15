'use client'

import { useRouter } from 'next/navigation'
import type { TodoEntity } from '@/domain/data/todo.data'
import { TodoFormComponent } from '@/component/functionless/todo'
import { updateTodoAction, type TodoFormActionState } from '@/component/client-page/todo/action'
import { useActionState } from 'react'

import { createInitialFormActionState } from '@/util/form-action-state'
import { withServerActionHandling } from '@/util/server-actions'

type TodoEditProps = {
  todo: TodoEntity
}

/**
 * todoの編集ページのコンポーネント
 *
 * - 特定のTodoEntityをpropsとして受け取る
 * - 受け取ったTodoEntityを表示する
 * - client component
 * - React Hooksを使用することが可能
 * - TodoFormComponentを使用してTodoの編集フォームを表示する
 * - 更新成功後は詳細画面に遷移する
 */
export function TodoEditClientPage({ todo }: TodoEditProps) {
  const router = useRouter()

  // 初期状態を作成
  const initialState: TodoFormActionState = createInitialFormActionState()
  initialState.title = todo.title
  initialState.description = todo.description
  initialState.completed = todo.isCompleted
  // Server Actionをラップ
  const wrappedAction = withServerActionHandling(updateTodoAction, {
    onSuccess: ({ success }) => {
      success('更新しました')
      router.push(`/`)
    },
    initialState,
  })

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
  )

  return (
    <TodoFormComponent
      mode={'update'}
      idValue={todo.id.toString()}
      formActionMethod={formAction}
      titleValue={state.title ?? todo?.title ?? ''}
      descriptionValue={state.description ?? todo?.description ?? ''}
      completedValue={state.completed ?? todo?.isCompleted ?? false}
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
  )
}
