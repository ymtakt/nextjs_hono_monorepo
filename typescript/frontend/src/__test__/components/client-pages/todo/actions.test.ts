'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createTodo } from '@/domain/logic/actions/todo/create-todo'
import { deleteTodo } from '@/domain/logic/actions/todo/delete-todo'
import { updateTodo } from '@/domain/logic/actions/todo/update-todo'
import type { ActionState } from '@/utils/actions'
import { ACTION_STATUS } from '@/utils/actions'
import { FORM_VALIDATION_ERROR_CODES, validationErrorState } from '@/utils/validation'

// エラーメッセージ管理
const TODO_ACTION_ERROR_MESSAGES = {
  TODO_ID_NOT_FOUND: 'TodoIDが見つかりません',
  TODO_CREATE_ERROR: 'Todoの作成に失敗しました',
  TODO_UPDATE_ERROR: 'Todoの更新に失敗しました',
  TODO_DELETE_ERROR: 'Todoの削除に失敗しました',
} as const

/**
 * Todo作成・更新用のバリデーションスキーマ
 *
 * zodを使用してフォームデータの検証を行う
 * エラーメッセージは識別子で管理する
 */
const todoActionFormSchema = z.object({
  title: z
    .string()
    .min(1, FORM_VALIDATION_ERROR_CODES.REQUIRED_TITLE)
    .max(100, FORM_VALIDATION_ERROR_CODES.TITLE_TOO_LONG),
  description: z.string().min(1, FORM_VALIDATION_ERROR_CODES.REQUIRED_DESCRIPTION),
  completed: z.boolean(),
})

/**
 * Todo用のバリデーションエラー型
 * create, update共通で使用
 *
 * 各フィールドに対応するエラーメッセージの配列を保持
 */
type TodoValidationErrors = {
  title: string[]
  description: string[]
  completed: string[]
}

/**
 * Todo作成・更新用のフォームフィールド型
 * create, update共通で使用
 *
 * フォーム内容の型定義
 */
type TodoFormFields = {
  todoId?: string
  title?: string
  description?: string
  completed?: boolean
}

// 削除用のフォームのフィールド型を定義
type DeleteTodoFields = {
  todoId?: string
}

export type DeleteTodoActionState = ActionState<DeleteTodoFields>

/**
 * Todo作成・更新用のActionState型
 */
export type TodoFormActionState = ActionState<TodoFormFields, TodoValidationErrors>

/**
 * Todo作成用のServer Action
 *
 * @param prevState - 前回のアクション実行結果（エラー時の入力値保持に使用）
 * @param formData - フォームから送信されたデータ
 * @returns Promise<TodoFormActionState> - 新しいアクション状態
 *
 * 処理の流れ：
 * 1. FormDataからデータを取得
 * 2. zodでバリデーション実行
 * 3. バリデーションエラー時：エラー状態を返す（入力値保持）
 * 4. 成功時：use-case呼び出し → キャッシュ更新 → 成功状態を返す
 * 5. サーバーエラー時：エラー状態を返す（入力値保持）
 */
export async function createTodoAction(
  _: TodoFormActionState,
  formData: FormData,
): Promise<TodoFormActionState> {
  // FormDataから値を取得
  const formFields: TodoFormFields = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    completed: formData.get('completed') === 'on',
  }

  // zodを使用してバリデーション実行
  const validationResult = todoActionFormSchema.safeParse(formFields)

  // バリデーションエラーの場合
  if (!validationResult.success) {
    // zodのエラーを平坦化してフィールドごとのエラー配列に変換
    const fieldErrors = validationResult.error.flatten().fieldErrors

    // validationErrorStateユーティリティを使用してエラー状態を作成
    // 入力値を保持してユーザーの再入力を防ぐ
    return validationErrorState<TodoFormFields, TodoFormActionState>(fieldErrors, formFields)
  }

  // バリデーション済みデータでTodo作成のuse-caseを呼び出し
  const result = await createTodo(validationResult.data)

  if (result.isErr()) {
    return {
      ...formFields,
      status: ACTION_STATUS.SERVER_ERROR,
      error: TODO_ACTION_ERROR_MESSAGES.TODO_CREATE_ERROR,
      validationErrors: null,
    }
  }

  // Next.jsのキャッシュを更新
  // 作成後に関連ページを最新状態にする
  revalidatePath('/')

  // 成功状態を返す
  // フィールドは未定義にしてフォームをクリアする
  return {
    status: ACTION_STATUS.SUCCESS,
    error: null,
    validationErrors: null,
  }
}

export async function updateTodoAction(
  prevState: TodoFormActionState,
  formData: FormData,
): Promise<TodoFormActionState> {
  const todoId = formData.get('todoId')
  if (!todoId) {
    return {
      ...prevState,
      status: ACTION_STATUS.VALIDATION_ERROR,
      error: TODO_ACTION_ERROR_MESSAGES.TODO_ID_NOT_FOUND,
      validationErrors: null,
    }
  }

  const formFields: TodoFormFields = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    completed: (formData.get('completed') === 'on') as boolean,
  }

  // バリデーション実行
  const validationResult = todoActionFormSchema.safeParse(formFields)

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors
    return validationErrorState<TodoFormFields, TodoFormActionState>(fieldErrors, formFields)
  }

  const result = await updateTodo(Number(todoId), validationResult.data)

  if (result.isErr()) {
    return {
      ...formFields,
      status: ACTION_STATUS.SERVER_ERROR,
      error: TODO_ACTION_ERROR_MESSAGES.TODO_UPDATE_ERROR,
      validationErrors: null,
    }
  }

  revalidatePath('/')
  revalidatePath(`/edit/${todoId}`)

  return {
    status: ACTION_STATUS.SUCCESS,
    error: null,
    validationErrors: null,
  }
}

export async function deleteTodoAction(
  _: DeleteTodoActionState,
  formData: FormData,
): Promise<DeleteTodoActionState> {
  const todoId = formData.get('todoId') as string

  if (!todoId) {
    return {
      status: ACTION_STATUS.SERVER_ERROR,
      error: TODO_ACTION_ERROR_MESSAGES.TODO_ID_NOT_FOUND,
      validationErrors: null,
      todoId,
    }
  }

  const result = await deleteTodo(Number(todoId))

  if (result.isErr()) {
    return {
      status: ACTION_STATUS.SERVER_ERROR,
      error: TODO_ACTION_ERROR_MESSAGES.TODO_DELETE_ERROR,
      validationErrors: null,
    }
  }

  revalidatePath('/')

  return {
    status: ACTION_STATUS.SUCCESS,
    error: null,
    validationErrors: null,
  }
}
