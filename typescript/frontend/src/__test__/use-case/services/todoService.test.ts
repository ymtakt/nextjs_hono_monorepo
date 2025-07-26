/* eslint-disable @typescript-eslint/no-explicit-any */

import { fetchTodos } from "@/core/services/todo.service";
import { apiClient } from "@/lib/apiClient";
import { describe, it, expect, vi } from "vitest";

// APIクライアントをモックしてテストします：
// モック
vi.mock("@/lib/apiClient", () => ({
  apiClient: {
    api: {
      todos: {
        $get: vi.fn(),
      },
    },
  },
}));

describe("fetchTodos", () => {
  it("正常にTodoリストを取得する", async () => {
    const mockTodos = {
      todos: [
        {
          id: 1,
          title: "Test Todo",
          completed: false,
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
        },
      ],
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockTodos),
    };

    vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse as any);

    const result = await fetchTodos();

    expect(result).toEqual(mockTodos);
    expect(apiClient.api.todos.$get).toHaveBeenCalledTimes(1);
  });

  it("APIエラー時に適切なエラーを投げる", async () => {
    const mockResponse = {
      ok: false,
      text: vi.fn().mockResolvedValue("Server Error"),
    };

    vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse as any);

    await expect(fetchTodos()).rejects.toThrow("Failed to fetch todos: Server Error");
  });
});
