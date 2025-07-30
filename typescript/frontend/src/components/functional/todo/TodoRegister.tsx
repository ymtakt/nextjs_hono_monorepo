'use client'

import { useRouter } from 'next/navigation'
import { createTodo } from '@/core/services/todo.service'
import type { TodoFormData } from '@/logic/data/todo'
import { useToast } from '@/logic/hooks/useToast'
import { TodoForm } from './TodoForm'

export function TodoRegister() {
  const router = useRouter()
  const { success } = useToast()

  const handleSubmit = async (data: TodoFormData) => {
    await createTodo({ ...data })
    success('Todoを作成しました')
    router.push('/')
  }

  return <TodoForm mode="create" onSubmit={handleSubmit} />
}
