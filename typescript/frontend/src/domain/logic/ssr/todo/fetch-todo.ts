import { err, ok, type Result } from 'neverthrow';
import { apiClient } from '@/core/service/api.service';
import type { TodoEntity } from '@/domain/data/todo.data';
import { transformToTodoEntity } from '../../utils/todo/transform-to-todo-entity';

/** UseCase で発生するエラー型の定義。 */
type UseCaseError = {
  type: 'TODO_FETCH_FAILED';
};

/**
 * 特定のTodoを取得する
 *
 * - APIクライアントを使用してリクエストを実行
 * - Hono RPCのURLを取得して、fetchを使用してリクエストを実行
 * - レスポンスが正常でない場合Result型のエラーを返す
 * - レスポンスボディをアプリケーションのEntityオブジェクトに変換
 * - server componentで使用される
 *
 * @param todo - 新規Todoのデータ
 * @returns 作成されたTodoのEntity
 */
export const fetchTodo = async (todoId: number): Promise<Result<TodoEntity, UseCaseError>> => {
  try {
    const res = await apiClient.api.todos[':todoId'].$get({
      param: { todoId: todoId.toString() },
    });

    // テスト用に1秒待つ
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!res.ok) {
      return err({ type: 'TODO_FETCH_FAILED' });
    }

    const data = await res.json();

    const todoEntity = transformToTodoEntity(data.todo);
    return ok(todoEntity);
  } catch {
    return err({ type: 'TODO_FETCH_FAILED' });
  }
};
