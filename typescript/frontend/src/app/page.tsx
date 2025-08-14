import { notFound } from 'next/navigation'
import { TodoListClientPage } from '@/components/client-pages/todo'
import { fetchTodos } from '@/domain/logic/ssr/todo/fetch-todos'

export default async function Home() {
  const result = await fetchTodos()

  if (result.isErr()) {
    notFound()
  }

  const todos = result.value

  return (
    <div className="min-h-screen bg-gray-50">
      <TodoListClientPage todos={todos} />
    </div>
  )
}
