import { TodoDetailClientPage } from '@/components/client-pages/todo'
import { fetchTodo } from '@/domain/logic/ssr/todo/fetch-todo'
import { notFound } from 'next/navigation'
import { match } from 'ts-pattern'

/**
 * todoの詳細ページ
 *
 * - 特定のTodoを取得する
 * - 取得したTodoをTodoDetailFunctionalPageに渡す
 * - TodoDetailFunctionalPageでTodoの詳細を表示する
 * - パラメータは動的に取得する
 * - server component
 * - 取得の際のエラー、ローディングはerror.tsx,loading.tsxで表示する
 */
export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await fetchTodo(Number(id))

  if (result.isErr()) {
    notFound()
  }

  const todo = result.value

  return <TodoDetailClientPage todo={todo} />
}
