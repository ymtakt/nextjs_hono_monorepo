import { getContext } from "hono/context-storage";
import { type Result, err, ok } from "neverthrow";
import type { EnvironmentVariables } from "../../../env";

/** Todo を作成する際のパラメータ。 */
type RepositoryParams = {
  title: string;
  description: string;
  userId: number;
};

/** Todo の作成結果。 */
type RepositoryResult = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 新しい Todo を作成する。
 * @param params - パラメータ。
 * @returns 作成された Todo の情報。
 */
export const createTodo = async (
  params: RepositoryParams,
): Promise<Result<RepositoryResult, Error>> => {
  const c = getContext<EnvironmentVariables>();
  const logger = c.get("logger");
  const prisma = c.get("prisma");

  try {
    // Todo を作成する。
    const createdTodo = await prisma.todo.create({
      data: {
        title: params.title,
        description: params.description,
        userId: params.userId,
      },
    });

    // 作成に失敗した場合はエラーを返す。
    if (!createdTodo) {
      return err(new Error(`Todo の作成に失敗しました: ${params.title}`));
    }

    // 作成した Todo の情報を返す。
    const result: RepositoryResult = {
      id: createdTodo.id,
      title: createdTodo.title,
      description: createdTodo.description,
      completed: createdTodo.completed,
      userId: createdTodo.userId,
      createdAt: new Date(createdTodo.createdAt),
      updatedAt: new Date(createdTodo.updatedAt),
    };

    return ok(result);
  } catch (error) {
    // エラーログを出力する。
    logger.error(`Todo の作成に失敗しました: ${error}`);
    return err(new Error(`Todo の作成に失敗しました: ${params.title}`));
  }
};
