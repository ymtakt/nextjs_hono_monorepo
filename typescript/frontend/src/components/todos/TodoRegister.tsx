// /Users/user/app/practice/nextjs_hono_monorepo/typescript/frontend/src/components/todos/TodoRegisterForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { TodoForm } from "./TodoForm";
import { createTodo } from "@/core/services/todo.service";
import { TodoFormData } from "@/logic/data/todo";
import { useToast } from "@/logic/hooks/useToast";


export default function TodoRegister() {
  const router = useRouter();
  const { success } = useToast();

  const handleSubmit = async (data: TodoFormData) => {
    await createTodo({ ...data });
    success("Todoを作成しました");
    router.push("/");
  };

  return (
    <TodoForm mode="create" onSubmit={handleSubmit} />
  );
}
