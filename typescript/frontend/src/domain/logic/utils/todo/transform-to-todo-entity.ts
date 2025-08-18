import type { TodoEntity } from '@/domain/data/todo.data';

/**
 * 外部APIから取得したデータをTodoEntityに変換する
 *
 * @param todoObject 外部APIから取得したデータ
 * @returns TodoEntity
 */
export const transformToTodoEntity = (todoObject: {
  title: string;
  description: string;
  completed: boolean;
  id: number;
  createdAt: string;
  updatedAt: string;
}): TodoEntity => ({
  // IDをそのまま設定
  id: todoObject.id,
  // タイトルをそのまま設定
  title: todoObject.title,
  // descriptionがnullまたはundefinedの場合は空文字に変換
  description: todoObject.description || '',
  // completedフィールドをisCompletedにマッピング
  isCompleted: todoObject.completed,
  // createdAtをcreatedDateにマッピング
  createdDate: todoObject.createdAt,
  // updatedAtがない場合はcreatedAtを使用
  updatedDate: todoObject.updatedAt || todoObject.createdAt,
});
