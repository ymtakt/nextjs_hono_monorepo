import { type Result, err, ok } from "neverthrow";
import { deleteTodo } from "../../repository/mutation/todo/deleteTodo";

/** UseCase のパラメータ型の定義。 */
type UseCaseParams = {
  todoId: number;
  userId: number;
};

/** UseCase で発生するエラー型の定義。 */
type UseCaseError = {
  type: "TODO_DELETE_FAILED";
  message: "Todo の削除に失敗しました";
};

export const deleteTodoUseCase = async (
  params: UseCaseParams,
): Promise<Result<void, UseCaseError>> => {
  // Repository を呼び出してデータを取得する。
  const repositoryResult = await deleteTodo(params);

  // Repository のエラーを UseCase のエラーに変換する。
  if (repositoryResult.isErr()) {
    return err({
      type: "TODO_DELETE_FAILED",
      message: "Todo の削除に失敗しました",
    });
  }

  return ok(undefined);
};
