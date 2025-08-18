import { getContext } from 'hono/context-storage'
import { err, ok, type Result } from 'neverthrow'
import type { EnvironmentVariables } from '../../../env'

/** Todo を更新する際のパラメータ。 */
type RepositoryParams = {
  todoId: number
  userId: number
  title: string
  description: string
  completed: boolean
}

/** Todo の更新結果。 */
type RepositoryResult = {
  id: number
  title: string
  description: string | null
  completed: boolean
  userId: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Todo を更新する。
 * @param params - パラメータ。
 * @returns 更新された Todo の情報。
 */
export const updateTodo = async (
  params: RepositoryParams,
): Promise<Result<RepositoryResult, Error>> => {
  const c = getContext<EnvironmentVariables>()
  const logger = c.get('logger')
  const prisma = c.get('prisma')

  try {
    // Todo を更新する。
    const updatedTodo = await prisma.todo.update({
      where: { id: params.todoId, userId: params.userId },
      data: {
        title: params.title,
        description: params.description,
        userId: params.userId,
        completed: params.completed,
      },
    })

    // 更新に失敗した場合はエラーを返す。
    if (!updatedTodo) {
      return err(new Error(`Todo の更新に失敗しました: ${params.todoId}`))
    }

    // 更新した Todo の情報を返す。
    const result: RepositoryResult = {
      id: updatedTodo.id,
      title: updatedTodo.title,
      description: updatedTodo.description,
      completed: updatedTodo.completed,
      userId: updatedTodo.userId,
      createdAt: new Date(updatedTodo.createdAt),
      updatedAt: new Date(updatedTodo.updatedAt),
    }

    return ok(result)
  } catch (error) {
    // エラーログを出力する。
    logger.error(`Todo の更新に失敗しました: ${error}`)
    return err(new Error(`Todo の更新に失敗しました: ${params.todoId}`))
  }
}
