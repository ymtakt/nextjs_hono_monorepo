import type { UpdateTodoRequest } from 'backend/schemas';
import { err, ok, type Result } from 'neverthrow';
import { apiClient } from '@/core/service/api.service';
import type { TodoEntity } from '@/domain/data/todo.data';
import type { ServeActionError } from '@/util/type';
import { transformToTodoEntity } from '../../utils/todo/transform-to-todo-entity';

/**
 * 特定のTodoを更新する
 *
 * @param todoId - 更新するTodoのID
 * @param todo - 更新するTodoのデータ
 * @returns 更新されたTodoのEntity
 */
export const updateTodo = async (
  todoId: number,
  todo: UpdateTodoRequest,
): Promise<Result<TodoEntity, ServeActionError>> => {
  try {
    const res = await apiClient.api.todos[':todoId'].$put({
      param: { todoId: todoId.toString() },
      json: todo,
    });

    if (!res.ok) {
      return err('SERVER_ACTION_ERROR');
    }

    // レスポンスボディをJSONとして解析
    const data = await res.json();

    const todoEntity = transformToTodoEntity(data.todo);
    return ok(todoEntity);
  } catch {
    return err('SERVER_ACTION_ERROR');
  }
};
