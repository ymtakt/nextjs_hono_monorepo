import type { CreateTodoRequest } from 'backend/schemas';
import { err, ok, type Result } from 'neverthrow';
import { apiClient } from '@/core/service/api.service';
import type { TodoEntity } from '@/domain/data/todo.data';
import type { ServeActionError } from '@/util/type';
import { transformToTodoEntity } from '../../utils/todo/transform-to-todo-entity';

/**
 * 新規Todoを作成する
 *
 * @param todo - 新規Todoのデータ
 * @returns 作成されたTodoのEntity
 */
export const createTodo = async (
  todo: CreateTodoRequest,
): Promise<Result<TodoEntity, ServeActionError>> => {
  try {
    const res = await apiClient.api.todos.$post({
      json: todo,
    });

    if (!res.ok) {
      return err('SERVER_ACTION_ERROR');
    }

    const data = await res.json();

    const todoEntity = transformToTodoEntity(data.todo);
    return ok(todoEntity);
  } catch {
    return err('SERVER_ACTION_ERROR');
  }
};
