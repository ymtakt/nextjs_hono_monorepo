import { type Result, err, ok } from "neverthrow";
import { updateTodo } from "../../repository/mutation/todo/updateTodo";

/** UseCase のパラメータ型の定義。 */
type UseCaseParams = {
  todoId: number;
  userId: number;
  title: string;
  description: string;
  completed: boolean;
};

/** UseCase の戻り値型の定義。 */
type UseCaseResult = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

/** UseCase で発生するエラー型の定義。 */
type UseCaseError = {
  type: "TODO_UPDATE_FAILED";
  message: "Todo の更新に失敗しました";
};

export const updateTodoUseCase = async (
  params: UseCaseParams
): Promise<Result<UseCaseResult, UseCaseError>> => {
  // Repository を呼び出してデータを取得する。
  const repositoryResult = await updateTodo(params);

  // Repository のエラーを UseCase のエラーに変換する。
  if (repositoryResult.isErr()) {
    return err({
      type: "TODO_UPDATE_FAILED",
      message: "Todo の更新に失敗しました",
    });
  }

  //  データを UseCase の戻り値型に変換する。
  const useCaseResult = {
    id: repositoryResult.value.id,
    title: repositoryResult.value.title,
    completed: repositoryResult.value.completed,
    description: repositoryResult.value.description,
    userId: repositoryResult.value.userId,
    createdAt: repositoryResult.value.createdAt.toISOString(),
    updatedAt: repositoryResult.value.updatedAt.toISOString(),
  };

  return ok(useCaseResult);
};
