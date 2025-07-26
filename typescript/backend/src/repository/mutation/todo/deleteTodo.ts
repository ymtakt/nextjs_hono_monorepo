import { getContext } from "hono/context-storage";
import { type Result, err, ok } from "neverthrow";
import type { EnvironmentVariables } from "../../../env";

/** Todo を削除する際のパラメータ。 */
type RepositoryParams = {
  todoId: number;
  userId: number;
};

/**
 * Todo を削除する。
 * @param params - パラメータ。
 * @returns 削除された Todo の情報。
 */
export const deleteTodo = async (params: RepositoryParams): Promise<Result<void, Error>> => {
  const c = getContext<EnvironmentVariables>();
  const logger = c.get("logger");
  const prisma = c.get("prisma");

  try {
    // Todo を削除する。
    const deletedTodo = await prisma.todo.delete({
      where: { id: params.todoId, userId: params.userId },
    });

    // 削除に失敗した場合はエラーを返す。
    if (!deletedTodo) {
      return err(new Error(`Todo の削除に失敗しました: ${params.todoId}`));
    }

    return ok(undefined);
  } catch (error) {
    // エラーログを出力する。
    logger.error(`Todo の削除に失敗しました: ${error}`);
    return err(new Error(`Todo の削除に失敗しました: ${params.todoId}`));
  }
};
