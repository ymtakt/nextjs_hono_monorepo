import { err, ok, type Result } from 'neverthrow';
import { apiClient } from '@/core/service/api.service';
import type { TodoEntity } from '@/domain/data/todo.data';
import type { SsrFetchError } from '@/util/type';
import { transformToTodoEntity } from '../../utils/todo/transform-to-todo-entity';

/**
 * 特定のTodoを取得する
 *
 * @param todo - 新規Todoのデータ
 * @returns 作成されたTodoのEntity
 */
export const fetchTodo = async (todoId: number): Promise<Result<TodoEntity, SsrFetchError>> => {
  try {
    const res = await apiClient.api.todos[':todoId'].$get({
      param: { todoId: todoId.toString() },
    });

    // テスト用に1秒待つ
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!res.ok) {
      // 共通のエラー定義してスローする
      return err('SSR_FETCH_ERROR');
    }

    const data = await res.json();

    const todoEntity = transformToTodoEntity(data.todo);
    return ok(todoEntity);
  } catch {
    // NOTE: SSRのフェッチエラーについては握りつぶしているので、エラーresultを返す設計である。
    return err('SSR_FETCH_ERROR');
  }
};
