import { apiClient } from "@/lib/apiClient";
import { CreateTodoRequest } from "backend/src/endpoint/handler/todo/createTodoHandler";
import { TodoResponse } from "backend/src/endpoint/handler/todo/getTodoHandler";
import { TodosResponse } from "backend/src/endpoint/handler/todo/getTodosHandler";
import { UpdateTodoRequest } from "backend/src/endpoint/handler/todo/updateTodoHandler";

export const fetchTodos = async (): Promise<TodosResponse> => {
  const res = await apiClient.api.todos.$get();

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch todos: ${errorText}`);
  }
  const data = await res.json();
  return data;
};

export const fetchTodo = async (todoId: number): Promise<TodoResponse> => {
  const res = await apiClient.api.todos[":todoId"].$get({
    param: { todoId: todoId.toString() },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch todo: ${errorText}`);
  }
  const data = await res.json();
  return data;
};

export const createTodo = async (todo: CreateTodoRequest): Promise<TodoResponse> => {
  const res = await apiClient.api.todos.$post({
    json: todo,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create todo: ${errorText}`);
  }
  const data = await res.json();
  return data;
};

export const updateTodo = async (
  todoId: number,
  todo: UpdateTodoRequest,
): Promise<TodoResponse> => {
  const res = await apiClient.api.todos[":todoId"].$put({
    param: { todoId: todoId.toString() },
    json: todo,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update todo: ${errorText}`);
  }
  const data = await res.json();
  return data;
};

export const deleteTodo = async (todoId: number): Promise<void> => {
  const res = await apiClient.api.todos[":todoId"].$delete({
    param: { todoId: todoId.toString() },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete todo: ${errorText}`);
  }
};
