import z from 'zod'

/**
 * Todo関連のデータ型定義とバリデーションスキーマを管理するモジュール。
 */

/**
 * アプリケーション内で使用するTodoエンティティの型定義。
 * APIレスポンスから変換された、統一されたデータ構造を表す。
 */
export type TodoEntity = {
  /** Todo項目の一意識別子 */
  id: number
  /** Todo項目のタイトル */
  title: string
  /** Todo項目の詳細説明 */
  description: string
  /** 完了状態（true: 完了、false: 未完了） */
  isCompleted: boolean
  /** 作成日時（ISO 8601形式の文字列） */
  createdDate: string
  /** 更新日時（ISO 8601形式の文字列） */
  updatedDate: string
}

/**
 * Todoフォームのバリデーションスキーマ。
 * react-hook-formと組み合わせてクライアントサイドバリデーションに使用する。
 */
export const todoFormSchema = z.object({
  /** タイトルは必須項目（1文字以上） */
  title: z.string().min(1, 'タイトルは必須です'),
  /** 説明は任意項目 */
  description: z.string(),
})

/**
 * Todoフォームで扱うデータの型定義。
 * todoFormSchemaから自動生成される。
 */
export type TodoFormData = z.infer<typeof todoFormSchema>
