import { TodoEditClientPage } from '@/components/client-pages/todo'
import { fetchTodo } from '@/logic/use-case/todo.use-case'

/**
 * todoの編集ページ
 *
 * - 特定のTodoを取得する
 * - 取得したTodoをTodoEditFunctionalPageに渡す
 * - TodoDetailFunctionalPageでTodoの詳細を表示する
 * - パラメータは動的に取得する
 * - server component
 * - 取得の際のエラー、ローディングはerror.tsx,loading.tsxで表示する
 */
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const todo = await fetchTodo(Number(id))

  return (
    <div className="max-w-2xl mx-auto p-6">
      <TodoEditClientPage todo={todo} />
    </div>
  )
}
