'use client'

import { notFound, useRouter } from 'next/navigation'
import { fetchTodo, updateTodo } from '@/core/services/todo.service'
import type { TodoFormData } from '@/logic/data/todo'
import { useAppSWR } from '@/logic/hooks/useSWRHooks'
import { useToast } from '@/logic/hooks/useToast'
import { transformToTodoEntity } from '@/logic/use-case/todo'
import { LoadingSpinner } from '../base/Loading'
import { TodoForm } from './TodoForm'

export default function TodoEdit({ id }: { id: number }) {
  const router = useRouter()
  const { success } = useToast()
  const { data, error, isLoading } = useAppSWR(`todo-${id}`, () => fetchTodo(id))

  // データが存在しない場合は404
  if (!isLoading && !error && !data?.todo) {
    notFound()
  }

  const todo = data?.todo ? transformToTodoEntity(data.todo) : null

  const handleSubmit = async (formData: TodoFormData) => {
    await updateTodo(id, {
      title: formData.title,
      description: formData.description,
      completed: false,
    })
    success('Todoを更新しました')
    router.push('/')
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <div className="text-red-500 text-lg">{error.message}</div>
  if (!todo) return <div>Todo not found</div>

  return <TodoForm mode="edit" defaultValues={todo} onSubmit={handleSubmit} />
}
