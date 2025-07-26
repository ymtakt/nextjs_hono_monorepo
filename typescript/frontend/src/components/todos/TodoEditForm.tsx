'use client'

import { useTodo } from "@/logic/hooks/todos/useTodo";
import TodoFormContent from "./TodoFormContent";

export default function TodoEditForm({ id }: { id: number }) {
  const { todo, loading, error: todoError } = useTodo(id);

  // ローディング中
  if (loading) {
    return <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  // エラー時
  if (todoError) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-red-500 text-lg">{todoError}</div>
      </div>
    );
  }

  // todoがない場合
  if (!todo) {
    return <div>Todo not found</div>;
  }

  // この時点でtodoは確実に存在する
  return <TodoFormContent todo={todo} id={id} />;
}