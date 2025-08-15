'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createTodo } from '@/domain/logic/action/todo/create-todo'
import { deleteTodo } from '@/domain/logic/action/todo/delete-todo'
import { updateTodo } from '@/domain/logic/action/todo/update-todo'
import {
  ACTION_STATUS,
  type ActionState,
  convertValidationErrors,
  getFirstValidationErrorMessage,
} from '@/util/server-actions'

/**
 * Todoアクションのサーバーエラーメッセージ定義
 *
 * Server Action実行時のエラーメッセージを管理
 * データベースエラーやドメインロジックエラーなど、サーバー側で発生するエラーに使用
 */
const TODO_ACTION_ERROR_MESSAGES = {
  TODO_ID_NOT_FOUND: 'TodoIDが見つかりません',
  TODO_CREATE_ERROR: 'Todoの作成に失敗しました',
  TODO_UPDATE_ERROR: 'Todoの更新に失敗しました',
  TODO_DELETE_ERROR: 'Todoの削除に失敗しました',
} as const

/**
 * Todoバリデーションエラーの表示用メッセージ定義
 *
 * zodバリデーションエラーの識別子と対応するユーザー表示用メッセージ
 * エラー識別子（例：REQUIRED_TITLE）から人間が読めるメッセージ（例：タイトルは必須です）への変換に使用
 */
const TODO_VALIDATION_ERROR_MESSAGES = {
  REQUIRED_TITLE: 'タイトルは必須です',
  TITLE_TOO_LONG: 'タイトルは100文字以内で入力してください',
  REQUIRED_DESCRIPTION: '説明を入力してください',
} as const

/**
 * Todoバリデーションエラーの識別子定義
 *
 * zodのバリデーションメッセージで使用する識別子
 * アプリケーション内でエラーの種類を一意に識別するために使用
 */
const TODO_VALIDATION_ERRORS = {
  REQUIRED_TITLE: 'REQUIRED_TITLE',
  TITLE_TOO_LONG: 'TITLE_TOO_LONG',
  REQUIRED_DESCRIPTION: 'REQUIRED_DESCRIPTION',
} as const

/**
 * Todoフォームフィールドの順序定義
 *
 * バリデーションエラー表示時の優先順位を決定
 * 最初のエラーメッセージを取得する際にこの順序で確認される
 */
const TODO_FIELD_ORDER = ['title', 'description', 'completed'] as const

/**
 * Todo作成・更新用のバリデーションスキーマ
 *
 * zodを使用してフォームデータの検証を行う
 * エラーメッセージは識別子で管理し、後でユーザー表示用メッセージに変換される
 *
 * @property title - タイトル（必須、100文字以内）
 * @property description - 説明（必須）
 * @property completed - 完了状態（boolean）
 */
const todoActionFormSchema = z.object({
  title: z
    .string()
    .min(1, TODO_VALIDATION_ERRORS.REQUIRED_TITLE)
    .max(100, TODO_VALIDATION_ERRORS.TITLE_TOO_LONG),
  description: z.string().min(1, TODO_VALIDATION_ERRORS.REQUIRED_DESCRIPTION),
  completed: z.boolean(),
})

/**
 * Todo用のバリデーションエラー型
 * create, update共通で使用
 *
 * 各フィールドに対応するエラーメッセージの配列を保持
 * ユーザー表示用に変換済みのメッセージが格納される
 *
 * @property title - タイトルフィールドのエラーメッセージ配列
 * @property description - 説明フィールドのエラーメッセージ配列
 * @property completed - 完了状態フィールドのエラーメッセージ配列
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
 * エラー時の入力値保持やフォームの初期値設定に使用
 *
 * @property todoId - Todo識別子（更新時のみ使用）
 * @property title - タイトル
 * @property description - 説明
 * @property completed - 完了状態
 */
type TodoFormFields = {
  todoId?: string
  title?: string
  description?: string
  completed?: boolean
}

/**
 * Todo削除用のフォームフィールド型
 *
 * 削除操作で必要となるフィールドを定義
 *
 * @property todoId - 削除対象のTodo識別子
 */
type DeleteTodoFields = {
  todoId?: string
}

/**
 * Todo削除用のActionState型
 *
 * useActionStateで使用される削除操作の状態管理型
 */
export type DeleteTodoActionState = ActionState<DeleteTodoFields>

/**
 * Todo作成・更新用のActionState型
 *
 * useActionStateで使用されるフォーム操作の状態管理型
 * バリデーションエラー、サーバーエラー、成功状態を含む
 */
export type TodoFormActionState = ActionState<TodoFormFields, TodoValidationErrors>

/**
 * Todo作成用のServer Action
 *
 * @param _ - 前回のアクション実行結果（エラー時の入力値保持に使用）
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
    const fieldErrors = validationResult.error.flatten().fieldErrors
    const convertedErrors = convertValidationErrors<TodoValidationErrors>(
      fieldErrors,
      TODO_VALIDATION_ERROR_MESSAGES,
      TODO_FIELD_ORDER,
    )
    return {
      ...formFields,
      status: ACTION_STATUS.VALIDATION_ERROR,
      error: getFirstValidationErrorMessage(convertedErrors, TODO_FIELD_ORDER),
      validationErrors: convertedErrors,
    }
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

/**
 * Todo更新用のServer Action
 *
 * @param prevState - 前回のアクション実行結果（エラー時の状態保持に使用）
 * @param formData - フォームから送信されたデータ
 * @returns Promise<TodoFormActionState> - 新しいアクション状態
 *
 * 処理の流れ：
 * 1. TodoIDの存在確認
 * 2. FormDataからデータを取得
 * 3. zodでバリデーション実行
 * 4. バリデーションエラー時：エラー状態を返す（入力値保持）
 * 5. 成功時：use-case呼び出し → キャッシュ更新 → 成功状態を返す
 * 6. サーバーエラー時：エラー状態を返す（入力値保持）
 */
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
    const convertedErrors = convertValidationErrors<TodoValidationErrors>(
      fieldErrors,
      TODO_VALIDATION_ERROR_MESSAGES,
      TODO_FIELD_ORDER,
    )
    return {
      ...formFields,
      status: ACTION_STATUS.VALIDATION_ERROR,
      error: getFirstValidationErrorMessage(convertedErrors, TODO_FIELD_ORDER),
      validationErrors: convertedErrors,
    }
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

/**
 * Todo削除用のServer Action
 *
 * @param _ - 前回のアクション実行結果（未使用）
 * @param formData - フォームから送信されたデータ
 * @returns Promise<DeleteTodoActionState> - 新しいアクション状態
 *
 * 処理の流れ：
 * 1. TodoIDの存在確認
 * 2. Todo削除のuse-case呼び出し
 * 3. エラー時：エラー状態を返す
 * 4. 成功時：キャッシュ更新 → 成功状態を返す
 */
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
