import { apiClient } from "@/lib/apiClient";
import { TodosResponse } from "backend/src/endpoint/handler/todo/getTodosHandler";

export const fetchTodos = async (): Promise<TodosResponse> => {
  const res = await apiClient.api.todos.$get();

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch todos: ${errorText}`);
  }
  const data = await res.json();
  return data;
};
