import { type Result, err, ok } from "neverthrow";
import { getTodosByUserId } from "../../repository/query/todo/getTodosByUserId";

/** UseCase のパラメータ型の定義。 */
type UseCaseParams = {
  userId: number;
};

/** UseCase の戻り値型の定義。 */
type UseCaseResult = {
  id: number;
  title: string;
  completed: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

/** UseCase で発生するエラー型の定義。 */
type UseCaseError = {
  type: "TODO_FETCH_FAILED";
  message: "Todo の取得に失敗しました";
};

export const fetchTodosUseCase = async (
  params: UseCaseParams,
): Promise<Result<UseCaseResult[], UseCaseError>> => {
  // Repository を呼び出してデータを取得する。
  const repositoryResult = await getTodosByUserId(params);

  // Repository のエラーを UseCase のエラーに変換する。
  if (repositoryResult.isErr()) {
    return err({
      type: "TODO_FETCH_FAILED",
      message: "Todo の取得に失敗しました",
    });
  }

  //  データを UseCase の戻り値型に変換する。
  const useCaseResult = repositoryResult.value.map((todo) => ({
    id: todo.id,
    title: todo.title,
    completed: todo.completed,
    description: todo.description,
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  }));

  return ok(useCaseResult);
};
