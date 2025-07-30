import { getContext } from 'hono/context-storage'
import { err, ok, type Result } from 'neverthrow'
import type { EnvironmentVariables } from '../../../env'

/** Todo を取得する際のパラメータ。 */
type RepositoryParams = {
  todoId: number
  userId: number
}

/** Todo の取得結果。 */
type Todo = {
  id: number
  title: string
  completed: boolean
  description: string | null
  userId: number
  createdAt: Date
  updatedAt: Date
}

export const getUserTodo = async (params: RepositoryParams): Promise<Result<Todo, Error>> => {
  const c = getContext<EnvironmentVariables>()
  const logger = c.get('logger')
  const prisma = c.get('prisma')

  try {
    // ユーザーIDに紐づくTODO一覧を取得する。（作成日時の降順）
    const todo = await prisma.todo.findUnique({
      where: { id: params.todoId, userId: params.userId },
    })

    if (!todo) return err(new Error('Todo が見つかりませんでした'))

    // ISO 8601 文字列を Date 型に変換して返す。
    const processedTodo = {
      ...todo,
      createdAt: new Date(todo.createdAt),
      updatedAt: new Date(todo.updatedAt),
    }

    return ok(processedTodo)
  } catch (error) {
    // エラーログを出力する。
    logger.error(`Todo の取得に失敗しました: ${error}`)
    return err(new Error(`Todo の取得に失敗しました: ${params.userId}`))
  }
}
