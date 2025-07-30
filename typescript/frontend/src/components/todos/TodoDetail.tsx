'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchTodo } from '@/core/services/todo.service'
import { useAppSWR } from '@/logic/hooks/useSWRHooks'
import { transformToTodoEntity } from '@/logic/use-case/todo'
import { LoadingSpinner } from '../base/Loading'

export default function TodoDetail({ id }: { id: number }) {
  // データ取得
  const { data, error, isLoading } = useAppSWR(`todo-${id}`, () => fetchTodo(id))

  // データが存在しない場合は404
  if (!isLoading && !error && !data?.todo) {
    notFound()
  }

  // DTOからEntityに変換
  const todo = data?.todo ? transformToTodoEntity(data.todo) : null

  if (isLoading) return <LoadingSpinner />

  // エラーの場合はuseAppSWR内でアプリケーションエラーに変換してメッセージを表示
  if (error) return <div className="text-red-500 text-lg">{error.message}</div>
  if (!todo) return <div>Todo not found</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Todo詳細</h1>
        </div>
        <Link
          href={`/edit/${todo.id}`}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          編集
        </Link>
      </div>

      {/* Todo詳細 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="space-y-6">
          {/* ステータス */}
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${todo.isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}
            ></div>
            <span
              className={`text-sm font-medium ${todo.isCompleted ? 'text-green-600' : 'text-gray-600'}`}
            >
              {todo.isCompleted ? '完了' : '未完了'}
            </span>
          </div>

          {/* タイトル */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{todo.title}</h2>
          </div>

          {/* 説明 */}
          {todo.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">説明</h3>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{todo.description}</p>
            </div>
          )}

          {/* 作成日時 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">作成日時</h3>
            <p className="text-gray-600">{new Date(todo.createdDate).toLocaleString('ja-JP')}</p>
          </div>

          {/* 更新日時 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">更新日時</h3>
            <p className="text-gray-600">{new Date(todo.updatedDate).toLocaleString('ja-JP')}</p>
          </div>

          {/* アクションボタン */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <Link
              href="/"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
