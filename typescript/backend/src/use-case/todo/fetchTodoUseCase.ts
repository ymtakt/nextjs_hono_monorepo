import { type Result, err, ok } from "neverthrow";
import { getUserTodo } from "../../repository/query/todo/getUserTodo";

/** UseCase のパラメータ型の定義。 */
type UseCaseParams = {
  todoId: number;
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

export const fetchTodoUseCase = async (
  params: UseCaseParams
): Promise<Result<UseCaseResult, UseCaseError>> => {
  // Repository を呼び出してデータを取得する。
  const repositoryResult = await getUserTodo(params);

  // Repository のエラーを UseCase のエラーに変換する。
  if (repositoryResult.isErr()) {
    return err({
      type: "TODO_FETCH_FAILED",
      message: "Todo の取得に失敗しました",
    });
  }

  //  データを UseCase の戻り値型に変換する。
  const useCaseResult = {
    id: repositoryResult.value.id,
    title: repositoryResult.value.title,
    completed: repositoryResult.value.completed,
    description: repositoryResult.value.description,
    createdAt: repositoryResult.value.createdAt.toISOString(),
    updatedAt: repositoryResult.value.updatedAt.toISOString(),
  };

  return ok(useCaseResult);
};
