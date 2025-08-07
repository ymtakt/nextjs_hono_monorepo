import type { CreateTodoRequest, UpdateTodoRequest } from 'backend/schemas'
import { apiClient } from '@/lib/apiClient'
import { ApplicationError, ERROR_CODES } from '@/utils/errors'
import type { TodoEntity } from '../data/todo.data'

const TODO_EXTERNAL_ERRORS = {
  FETCH: {
    FAILED: 'endpoint.getTodos.fetchFailed.1',
  },
  CREATE: {
    FAILED: 'endpoint.createTodo.createFailed.1',
    VALIDATION_ERROR: 'endpoint.createTodo.validationError.1',
  },
  UPDATE: {
    FAILED: 'endpoint.updateTodo.updateFailed.1',
    VALIDATION_ERROR: 'endpoint.updateTodo.validationError.1',
  },
  DELETE: {
    FAILED: 'endpoint.deleteTodo.deleteFailed.1',
    VALIDATION_ERROR: 'endpoint.deleteTodo.validationError.1',
  },
} as const

/**
 * logic/use-case/
 *  - UseCase
 *
 * ビジネスロジック
 *  - Reactが出てこない
 *  - ロジックにViewの概念は出てこない
 *  - アプリの言葉や知識が出てくる（Entity）
 *  - Entityの操作（書き込み、保存、配列操作などの計算）
 *  - Entityの操作のための外部通信をモックで置き換え可能な状態　かつ 外部通信先の情報の内部までを知る必要がない
 *  - コンポーネントに直接関係しない変換処理やドメインロジックを含む
 *
 * 悪い例
 *  - httpErrorがこの関数から出てくる
 */

export const transformToTodoEntity = (todoObject: {
  title: string
  description: string
  completed: boolean
  id: number
  createdAt: string
  updatedAt: string
}): TodoEntity => ({
  // IDをそのまま設定
  id: todoObject.id,
  // タイトルをそのまま設定
  title: todoObject.title,
  // descriptionがnullまたはundefinedの場合は空文字に変換
  description: todoObject.description || '',
  // completedフィールドをisCompletedにマッピング
  isCompleted: todoObject.completed,
  // createdAtをcreatedDateにマッピング
  createdDate: todoObject.createdAt,
  // updatedAtがない場合はcreatedAtを使用
  updatedDate: todoObject.updatedAt || todoObject.createdAt,
})

// result型にするか、またはTodoの取得エラーを返すようにする
// この方針は決め切る
// 実現したいユーザー体験に合わせる

/**
 * 特定のTodoを取得する
 *
 * - APIクライアントを使用してリクエストを実行
 * - Hono RPCのURLを取得して、fetchを使用してリクエストを実行
 * - レスポンスが正常でない場合はエラーを投げる・・・error.tsxでエラーを表示する
 * - レスポンスボディをアプリケーションのEntityオブジェクトに変換
 * - server componentで使用される
 * - fetchを使用することで、ローディング、エラー処理、キャッシュなどを簡単に実装可能
 *
 * @param todo - 新規Todoのデータ
 * @returns 作成されたTodoのEntity
 */
export const fetchTodo = async (todoId: number): Promise<TodoEntity> => {
  const res = await apiClient.api.todos[':todoId'].$get({
    param: { todoId: todoId.toString() },
  })

  // テスト用に1秒待つ
  await new Promise((resolve) => setTimeout(resolve, 1000))

  if (!res.ok) {
    console.log(res)
    // ステータスコードを判別して、アプリケーションエラーをthrowする
    if (res.statusText === TODO_EXTERNAL_ERRORS.FETCH.FAILED) {
      throw new ApplicationError(ERROR_CODES.ACTION_TODO.ID_NOT_FOUND)
    }
    throw new Error()
  }

  const data = await res.json()

  const todoEntity = transformToTodoEntity(data.todo)
  return todoEntity
}

export const fetchTodos = async (): Promise<TodoEntity[]> => {
  // APIクライアントを使用してGETリクエストを実行
  // テストで置き換え可能
  const res = await apiClient.api.todos.$get()

  // テスト用に1秒待つ
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // レスポンスが正常でない場合はエラーを投げる
  if (!res.ok) {
    // ステータスコードを判別して、アプリケーションエラーをthrowする
    if (res.statusText === TODO_EXTERNAL_ERRORS.FETCH.FAILED) {
      throw new ApplicationError(ERROR_CODES.ACTION_TODO.ID_NOT_FOUND)
    }
    throw new Error()
  }

  // レスポンスボディをJSONとして解析
  const data = await res.json()
  return data.todos.map((todo) => transformToTodoEntity(todo))
}

/**
 * 新規Todoを作成する
 *
 * - APIクライアントを使用してリクエストを実行
 * - Hono RPCを使用してリクエストを実行
 * - レスポンスが正常でない場合はエラーを投げる
 * - レスポンスボディをアプリケーションのEntityオブジェクトに変換
 * - server actionで使用される
 *
 * @param todo - 新規Todoのデータ
 * @returns 作成されたTodoのEntity
 */
export const createTodo = async (todo: CreateTodoRequest): Promise<TodoEntity> => {
  // リクエストボディにTodoデータを設定してPOSTリクエストを実行
  const res = await apiClient.api.todos.$post({
    json: todo,
  })

  if (!res.ok) {
    if (res.statusText === TODO_EXTERNAL_ERRORS.CREATE.VALIDATION_ERROR) {
      throw new ApplicationError(ERROR_CODES.ACTION_TODO.FORM_DATA_INVALID)
    }
    throw new Error()
  }

  const data = await res.json()

  const todoEntity = transformToTodoEntity(data.todo)
  return todoEntity
}

export const updateTodo = async (todoId: number, todo: UpdateTodoRequest): Promise<TodoEntity> => {
  // パスパラメータとリクエストボディを設定してPUTリクエストを実行
  const res = await (apiClient.api.todos[':todoId'] as any).$put({
    param: { todoId: todoId.toString() },
    json: todo,
  })

  if (!res.ok) {
    if (res.statusText === TODO_EXTERNAL_ERRORS.UPDATE.VALIDATION_ERROR) {
      throw new ApplicationError(ERROR_CODES.ACTION_TODO.FORM_DATA_INVALID)
    }
    throw new Error()
  }

  // レスポンスボディをJSONとして解析
  const data = await res.json()

  const todoEntity = transformToTodoEntity(data.todo)
  return todoEntity
}

export const deleteTodo = async (todoId: number): Promise<void> => {
  // パスパラメータにTodoIDを設定してDELETEリクエストを実行
  const res = await apiClient.api.todos[':todoId'].$delete({
    param: { todoId: todoId.toString() },
  })

  if (!res.ok) {
    if (res.statusText === TODO_EXTERNAL_ERRORS.DELETE.VALIDATION_ERROR) {
      throw new ApplicationError(ERROR_CODES.ACTION_TODO.FORM_DATA_INVALID)
    }
    throw new Error()
  }
}
