// hooks/useTodos.ts
import { useAsyncData } from "@/logic/hooks/useAsyncData";
import { fetchTodos } from "@/core/services/todo.service";
import { TodoEntity } from "@/logic/data/todo";

export const useTodos = (): {
  todos: TodoEntity[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
} => {
  const { data, loading, error, execute } = useAsyncData(async () => {
    const response = await fetchTodos();

    // 直接変換 + バリデーション
    return response.todos.map((todo) => {
      // 簡単なバリデーション
      if (!todo.title?.trim()) {
        throw new Error("Invalid todo: title is required");
      }

      // Entity変換
      return {
        id: todo.id,
        title: todo.title,
        description: todo.description,
        isCompleted: todo.completed,
        createdDate: todo.createdAt,
        updatedDate: todo.updatedAt || todo.createdAt,
      };
    });
  });

  return {
    todos: data || [],
    loading,
    error,
    refetch: execute,
  };
};
