import { TodoDetailClientPage } from '@/components/client-pages/todo'
import { fetchTodo } from '@/logic/use-case/todo.use-case'

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
  const todo = await fetchTodo(Number(id))

  // 分けなくても良い
  // 分ける　=　境界に意味がある
  // コードを書くにあたって迷い（実務上）
  return <TodoDetailClientPage todo={todo} />
}
