import { err, ok, type Result } from 'neverthrow'
import { apiClient } from '@/core/service/api.service'

/** UseCase で発生するエラー型の定義。 */
type UseCaseError = {
  type: 'TODO_DELETE_FAILED'
}

export const deleteTodo = async (todoId: number): Promise<Result<void, UseCaseError>> => {
  try {
    // パスパラメータにTodoIDを設定してDELETEリクエストを実行
    const res = await apiClient.api.todos[':todoId'].$delete({
      param: { todoId: todoId.toString() },
    })

    if (!res.ok) {
      return err({ type: 'TODO_DELETE_FAILED' })
    }
    return ok()
  } catch {
    return err({ type: 'TODO_DELETE_FAILED' })
  }
}
