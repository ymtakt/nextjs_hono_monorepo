import type { TodoEntity } from '../data/todo'

/**
 * Todo関連のビジネスロジックを定義するモジュール。
 * コンポーネントに直接関係しない変換処理やドメインロジックを含む。
 */

/**
 * APIレスポンスのTodoデータをアプリケーション内のTodoEntityに変換する関数。
 *
 * @param apiTodo - API から取得した生のTodoデータ
 * @returns アプリケーション内で使用するTodoEntity型のオブジェクト
 *
 * @example
 * ```typescript
 * const apiData = {
 *   id: 1,
 *   title: "買い物",
 *   description: null,
 *   completed: false,
 *   createdAt: "2024-01-01T00:00:00Z",
 *   updatedAt: null
 * };
 * const entity = transformToTodoEntity(apiData);
 * // entity.description は ""、entity.updatedDate は createdAt と同じ値になる
 * ```
 */
// TODO: any型を適切な型に置き換える検討が必要
export const transformToTodoEntity = (apiTodo: any): TodoEntity => ({
  // IDをそのまま設定
  id: apiTodo.id,
  // タイトルをそのまま設定
  title: apiTodo.title,
  // descriptionがnullまたはundefinedの場合は空文字に変換
  description: apiTodo.description || '',
  // completedフィールドをisCompletedにマッピング
  isCompleted: apiTodo.completed,
  // createdAtをcreatedDateにマッピング
  createdDate: apiTodo.createdAt,
  // updatedAtがない場合はcreatedAtを使用
  updatedDate: apiTodo.updatedAt || apiTodo.createdAt,
})
