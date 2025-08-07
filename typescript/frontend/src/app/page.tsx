import { TodoListClientPage } from '@/components/client-pages/todo'
import { fetchTodos } from '@/logic/use-case/todo.use-case'

export default async function Home() {
  console.log('start')
  const todos = await fetchTodos()
  console.log('end')
  return (
    <div className="min-h-screen bg-gray-50">
      <TodoListClientPage todos={todos} />
    </div>
  )
}
