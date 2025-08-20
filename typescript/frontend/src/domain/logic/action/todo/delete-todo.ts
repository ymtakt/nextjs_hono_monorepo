import { err, ok, type Result } from 'neverthrow';
import { apiClient } from '@/core/service/api.service';
import { ServeActionError } from '@/util/type';


export const deleteTodo = async (todoId: number): Promise<Result<void, ServeActionError>> => {
  try {
    // パスパラメータにTodoIDを設定してDELETEリクエストを実行
    const res = await apiClient.api.todos[':todoId'].$delete({
      param: { todoId: todoId.toString() },
    });

    if (!res.ok) {
      return err('SERVER_ACTION_ERROR');
    }
    return ok();
  } catch {
    return err('SERVER_ACTION_ERROR');
  }
};
