// hooks/useTodo.ts
import { useAsyncData } from "@/logic/hooks/useAsyncData";
import { fetchTodo } from "@/core/services/todo.service";
import { TodoEntity } from "@/logic/data/todo";

export const useTodo = (
  id: number,
): {
  todo: TodoEntity | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} => {
  const { data, loading, error, execute } = useAsyncData(async () => {
    const response = await fetchTodo(id);

    // バリデーション
    if (!response.todo.title?.trim()) {
      throw new Error("Invalid todo: title is required");
    }

    // Entity変換
    return {
      id: response.todo.id,
      title: response.todo.title,
      description: response.todo.description,
      isCompleted: response.todo.completed,
      createdDate: response.todo.createdAt,
      updatedDate: response.todo.updatedAt || response.todo.createdAt,
    };
  });

  return {
    todo: data,
    loading,
    error,
    refetch: execute,
  };
};
