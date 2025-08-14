/**
 * logic/data/
 *  - Data層
 *
 *  - ロジックにViewの概念は出てこない
 *  - アプリケーション内で使用するデータ型定義
 *  - バリデーションスキーマ
 *  - スキーマ関連は単一の（子）コンポーネントのみで使用する場合はそのファイルに直接定義する
 *  - スキーマ関連は複数でほぼ同じものを使用する場合はロジック層に定義する
 *
 * 注意：
 *  - アプリ内で表示する文字をここでは管理しない
 */

export type TodoEntity = {
  id: number
  title: string
  description: string
  isCompleted: boolean
  createdDate: string
  updatedDate: string
}
