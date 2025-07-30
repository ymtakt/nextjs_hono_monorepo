import type { CreateTodoRequest } from 'backend/src/endpoint/handler/todo/createTodoHandler'
import type { TodoResponse } from 'backend/src/endpoint/handler/todo/getTodoHandler'
import type { TodosResponse } from 'backend/src/endpoint/handler/todo/getTodosHandler'
import type { UpdateTodoRequest } from 'backend/src/endpoint/handler/todo/updateTodoHandler'
import { apiClient } from '@/lib/apiClient'
import { ApiError } from '@/utils/errors'

/**
 * Todo関連のAPI通信を行うサービス層の関数群。
 * 各関数はAPIクライアントを使用してバックエンドと通信し、
 * エラー時は統一されたApiErrorを投げる。
 */

/**
 * 全てのTodo項目を取得する関数。
 *
 * @returns Todo項目一覧を含むレスポンスオブジェクトのPromise
 * @throws {ApiError} API通信でエラーが発生した場合
 *
 * @example
 * ```typescript
 * try {
 *   const response = await fetchTodos();
 *   console.log(response.todos); // Todo項目の配列
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.error(`API Error ${error.status}: ${error.message}`);
 *   }
 * }
 * ```
 */
export const fetchTodos = async (): Promise<TodosResponse> => {
  // APIクライアントを使用してGETリクエストを実行
  const res = await apiClient.api.todos.$get()

  // レスポンスが正常でない場合はエラーを投げる
  if (!res.ok) {
    const errorText = await res.text()
    throw new ApiError(res.status, errorText)
  }

  // レスポンスボディをJSONとして解析
  const data = await res.json()
  return data
}

/**
 * 指定されたIDの単一Todo項目を取得する関数。
 *
 * @param todoId - 取得対象のTodo項目ID
 * @returns 単一のTodo項目を含むレスポンスオブジェクトのPromise
 * @throws {ApiError} API通信でエラーが発生した場合（404: 項目が存在しない場合を含む）
 *
 * @example
 * ```typescript
 * try {
 *   const response = await fetchTodo(1);
 *   console.log(response.todo); // 単一のTodo項目
 * } catch (error) {
 *   if (error instanceof ApiError && error.status === 404) {
 *     console.error("Todo項目が見つかりません");
 *   }
 * }
 * ```
 */
export const fetchTodo = async (todoId: number): Promise<TodoResponse> => {
  // パスパラメータにTodoIDを設定してGETリクエストを実行
  const res = await apiClient.api.todos[':todoId'].$get({
    param: { todoId: todoId.toString() },
  })

  // レスポンスが正常でない場合はエラーを投げる
  if (!res.ok) {
    const errorText = await res.text()
    throw new ApiError(res.status, errorText)
  }

  // レスポンスボディをJSONとして解析
  const data = await res.json()
  return data
}

/**
 * 新しいTodo項目を作成する関数。
 *
 * @param todo - 作成するTodo項目のデータ
 * @returns 作成されたTodo項目を含むレスポンスオブジェクトのPromise
 * @throws {ApiError} API通信でエラーが発生した場合（400: バリデーションエラーを含む）
 *
 * @example
 * ```typescript
 * try {
 *   const newTodo = {
 *     title: "買い物に行く",
 *     description: "牛乳とパンを買う",
 *     completed: false
 *   };
 *   const response = await createTodo(newTodo);
 *   console.log(response.todo); // 作成されたTodo項目（IDが付与される）
 * } catch (error) {
 *   if (error instanceof ApiError && error.status === 400) {
 *     console.error("入力データに問題があります");
 *   }
 * }
 * ```
 */
export const createTodo = async (todo: CreateTodoRequest): Promise<TodoResponse> => {
  // リクエストボディにTodoデータを設定してPOSTリクエストを実行
  const res = await apiClient.api.todos.$post({
    json: todo,
  })

  // レスポンスが正常でない場合はエラーを投げる
  if (!res.ok) {
    const errorText = await res.text()
    throw new ApiError(res.status, errorText)
  }

  // レスポンスボディをJSONとして解析
  const data = await res.json()
  return data
}

/**
 * 既存のTodo項目を更新する関数。
 *
 * @param todoId - 更新対象のTodo項目ID
 * @param todo - 更新するTodo項目のデータ
 * @returns 更新されたTodo項目を含むレスポンスオブジェクトのPromise
 * @throws {ApiError} API通信でエラーが発生した場合（404: 項目が存在しない、400: バリデーションエラーを含む）
 *
 * @example
 * ```typescript
 * try {
 *   const updatedData = {
 *     title: "買い物完了",
 *     description: "牛乳とパンを購入済み",
 *     completed: true
 *   };
 *   const response = await updateTodo(1, updatedData);
 *   console.log(response.todo); // 更新されたTodo項目
 * } catch (error) {
 *   if (error instanceof ApiError && error.status === 404) {
 *     console.error("更新対象のTodo項目が見つかりません");
 *   }
 * }
 * ```
 */
export const updateTodo = async (
  todoId: number,
  todo: UpdateTodoRequest,
): Promise<TodoResponse> => {
  // パスパラメータとリクエストボディを設定してPUTリクエストを実行
  const res = await apiClient.api.todos[':todoId'].$put({
    param: { todoId: todoId.toString() },
    json: todo,
    // 型システムの制約により一時的にany型でキャスト
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)

  // レスポンスが正常でない場合はエラーを投げる
  if (!res.ok) {
    const errorText = await res.text()
    throw new ApiError(res.status, errorText)
  }

  // レスポンスボディをJSONとして解析
  const data = await res.json()
  return data
}

/**
 * 指定されたIDのTodo項目を削除する関数。
 *
 * @param todoId - 削除対象のTodo項目ID
 * @returns 処理完了を示すPromise（戻り値なし）
 * @throws {ApiError} API通信でエラーが発生した場合（404: 項目が存在しない、403: 権限不足を含む）
 *
 * @example
 * ```typescript
 * try {
 *   await deleteTodo(1);
 *   console.log("Todo項目を削除しました");
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     switch (error.status) {
 *       case 404:
 *         console.error("削除対象のTodo項目が見つかりません");
 *         break;
 *       case 403:
 *         console.error("この項目を削除する権限がありません");
 *         break;
 *       default:
 *         console.error("削除処理でエラーが発生しました");
 *     }
 *   }
 * }
 * ```
 */
export const deleteTodo = async (todoId: number): Promise<void> => {
  // パスパラメータにTodoIDを設定してDELETEリクエストを実行
  const res = await apiClient.api.todos[':todoId'].$delete({
    param: { todoId: todoId.toString() },
  })

  // レスポンスが正常でない場合はエラーを投げる
  if (!res.ok) {
    const errorText = await res.text()
    throw new ApiError(res.status, errorText)
  }

  // 削除処理は戻り値なしで正常終了
}
