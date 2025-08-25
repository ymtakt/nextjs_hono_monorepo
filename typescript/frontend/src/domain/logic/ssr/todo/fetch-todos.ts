import { err, ok, type Result } from 'neverthrow';
import { apiClient } from '@/core/service/api.service';
import type { TodoEntity } from '@/domain/data/todo.data';
import type { SsrFetchError } from '@/util/type';
import { transformToTodoEntity } from '../../utils/todo/transform-to-todo-entity';

/**
 * 全てのTodoを取得する
 *
 */
export const fetchTodos = async (search?: string): Promise<Result<TodoEntity[], SsrFetchError>> => {
  try {
    // APIクライアントを使用してGETリクエストを実行
    const res = await apiClient.api.todos.$get({
      query: {
        search,
      },
    });

    // テスト用に1秒待つ
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!res.ok) {
      return err('SSR_FETCH_ERROR');
    }

    // レスポンスボディをJSONとして解析
    const data = await res.json();
    return ok(data.todos.map((todo) => transformToTodoEntity(todo)));
  } catch {
    // Note: SSRのフェッチエラーについては握りつぶしているので、エラーresultを返す設計である。
    return err('SSR_FETCH_ERROR');
  }
};
