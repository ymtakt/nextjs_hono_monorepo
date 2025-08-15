import type { CreateTodoRequest } from 'backend/schemas'
import { err, ok, type Result } from 'neverthrow'
import { apiClient } from '@/core/service/api.service'
import type { TodoEntity } from '@/domain/data/todo.data'
import { transformToTodoEntity } from '../../utils/todo/transform-to-todo-entity'

/** UseCase で発生するエラー型の定義。 */
type UseCaseError = {
  type: 'TODO_CREATE_FAILED'
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
export const createTodo = async (
  todo: CreateTodoRequest,
): Promise<Result<TodoEntity, UseCaseError>> => {
  try {
    const res = await apiClient.api.todos.$post({
      json: todo,
    })

    if (!res.ok) {
      return err({ type: 'TODO_CREATE_FAILED' })
    }

    const data = await res.json()

    const todoEntity = transformToTodoEntity(data.todo)
    return ok(todoEntity)
  } catch {
    return err({ type: 'TODO_CREATE_FAILED' })
  }
}
