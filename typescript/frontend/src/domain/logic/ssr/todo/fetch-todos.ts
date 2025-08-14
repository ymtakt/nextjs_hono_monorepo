import { err, ok, type Result } from 'neverthrow'
import { apiClient } from '@/core/services/api.service'
import type { TodoEntity } from '@/domain/data/todo.data'
import { transformToTodoEntity } from '../../utils/todo/transform-to-todo-entity'

/** UseCase で発生するエラー型の定義。 */
type UseCaseError = {
  type: 'TODO_FETCH_FAILED'
}

/**
 * 全てのTodoを取得する
 *
 * - APIクライアントを使用してGETリクエストを実行
 * - テストで置き換え可能
 * - テスト用に1秒待つ
 * - レスポンスが正常でない場合はエラーを投げる
 * - ステータスコードを判別して、アプリケーションエラーをthrowする
 * - レスポンスボディをJSONとして解析
 */
export const fetchTodos = async (search?: string): Promise<Result<TodoEntity[], UseCaseError>> => {
  try {
    // APIクライアントを使用してGETリクエストを実行
    // テストで置き換え可能
    const res = await apiClient.api.todos.$get({
      query: {
        search,
      },
    })

    // テスト用に1秒待つ
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (!res.ok) {
      return err({ type: 'TODO_FETCH_FAILED' })
    }

    // レスポンスボディをJSONとして解析
    const data = await res.json()
    return ok(data.todos.map((todo) => transformToTodoEntity(todo)))
  } catch {
    return err({ type: 'TODO_FETCH_FAILED' })
  }
}
