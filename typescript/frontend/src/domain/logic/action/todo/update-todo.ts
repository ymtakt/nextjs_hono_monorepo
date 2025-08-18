import type { UpdateTodoRequest } from 'backend/schemas';
import { err, ok, type Result } from 'neverthrow';
import { apiClient } from '@/core/service/api.service';
import type { TodoEntity } from '@/domain/data/todo.data';
import { transformToTodoEntity } from '../../utils/todo/transform-to-todo-entity';

/** UseCase で発生するエラー型の定義。 */
type UseCaseError = {
  type: 'TODO_UPDATE_FAILED';
};

/**
 * 特定のTodoを更新する
 *
 * - APIクライアントを使用してリクエストを実行
 * - Hono RPCを使用してリクエストを実行
 * - レスポンスが正常でない場合はエラーを投げる
 * - レスポンスボディをアプリケーションのEntityオブジェクトに変換
 * - server actionで使用される
 *
 * @param todoId - 更新するTodoのID
 * @param todo - 更新するTodoのデータ
 * @returns 更新されたTodoのEntity
 */
export const updateTodo = async (
  todoId: number,
  todo: UpdateTodoRequest,
): Promise<Result<TodoEntity, UseCaseError>> => {
  try {
    const res = await apiClient.api.todos[':todoId'].$put({
      param: { todoId: todoId.toString() },
      json: todo,
    });

    if (!res.ok) {
      return err({ type: 'TODO_UPDATE_FAILED' });
    }

    // レスポンスボディをJSONとして解析
    const data = await res.json();

    const todoEntity = transformToTodoEntity(data.todo);
    return ok(todoEntity);
  } catch {
    return err({ type: 'TODO_UPDATE_FAILED' });
  }
};
