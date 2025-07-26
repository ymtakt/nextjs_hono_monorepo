import { getContext } from "hono/context-storage";
import { type Result, err, ok } from "neverthrow";
import { EnvironmentVariables } from "../../../env";

/** Todo を取得する際のパラメータ。 */
type RepositoryParams = {
  userId: number;
};

/** Todo の取得結果。 */
type Todo = {
  id: number;
  title: string;
  completed: boolean;
  description: string | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

export const getTodosByUserId = async (
  params: RepositoryParams,
): Promise<Result<Todo[], Error>> => {
  const c = getContext<EnvironmentVariables>();
  const logger = c.get("logger");
  const prisma = c.get("prisma");

  try {
    // ユーザーIDに紐づくTODO一覧を取得する。（作成日時の降順）
    const todos = await prisma.todo.findMany({
      where: { userId: params.userId },
      orderBy: { createdAt: "desc" },
    });

    // ISO 8601 文字列を Date 型に変換して返す。
    const processedTodos = todos.map((todo) => ({
      ...todo,
      createdAt: new Date(todo.createdAt),
      updatedAt: new Date(todo.updatedAt),
    }));

    return ok(processedTodos);
  } catch (error) {
    // エラーログを出力する。
    logger.error(`Todo 一覧の取得に失敗しました: ${error}`);
    return err(new Error(`Todo 一覧の取得に失敗しました: ${params.userId}`));
  }
};
