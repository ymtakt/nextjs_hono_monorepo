import { transformToTodoEntity } from "@/logic/use-case/todo";
import { describe, it, expect } from "vitest";

/**
 * transformToTodoEntity関数のテスト。
 * APIレスポンスからTodoEntityへの変換処理を検証する。
 */
describe("transformToTodoEntity", () => {
  /**
   * 完全なAPIデータが正しく変換されることを検証する。
   */
  it("完全なAPIデータが正しく変換される", () => {
    const apiTodo = {
      id: 1,
      title: "テストタイトル",
      description: "テスト説明",
      completed: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    };

    const result = transformToTodoEntity(apiTodo);

    expect(result).toEqual({
      id: 1,
      title: "テストタイトル",
      description: "テスト説明",
      isCompleted: true,
      createdDate: "2024-01-01T00:00:00Z",
      updatedDate: "2024-01-02T00:00:00Z",
    });
  });

  /**
   * descriptionがnullの場合に空文字に変換されることを検証する。
   */
  it("descriptionがnullの場合に空文字に変換される", () => {
    const apiTodo = {
      id: 2,
      title: "タイトルのみ",
      description: null,
      completed: false,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    const result = transformToTodoEntity(apiTodo);

    expect(result.description).toBe("");
  });

  /**
   * descriptionがundefinedの場合に空文字に変換されることを検証する。
   */
  it("descriptionがundefinedの場合に空文字に変換される", () => {
    const apiTodo = {
      id: 3,
      title: "タイトルのみ",
      completed: false,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    const result = transformToTodoEntity(apiTodo);

    expect(result.description).toBe("");
  });

  /**
   * updatedAtがnullの場合にcreatedAtが使用されることを検証する。
   */
  it("updatedAtがnullの場合にcreatedAtが使用される", () => {
    const apiTodo = {
      id: 4,
      title: "更新なし",
      description: "説明",
      completed: false,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: null,
    };

    const result = transformToTodoEntity(apiTodo);

    expect(result.updatedDate).toBe("2024-01-01T00:00:00Z");
  });

  /**
   * updatedAtがundefinedの場合にcreatedAtが使用されることを検証する。
   */
  it("updatedAtがundefinedの場合にcreatedAtが使用される", () => {
    const apiTodo = {
      id: 5,
      title: "更新なし",
      description: "説明",
      completed: false,
      createdAt: "2024-01-01T00:00:00Z",
    };

    const result = transformToTodoEntity(apiTodo);

    expect(result.updatedDate).toBe("2024-01-01T00:00:00Z");
  });

  /**
   * completedフィールドがisCompletedに正しくマッピングされることを検証する。
   */
  it("completedフィールドがisCompletedに正しくマッピングされる", () => {
    const apiTodoTrue = {
      id: 6,
      title: "完了済み",
      description: "説明",
      completed: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    const apiTodoFalse = {
      id: 7,
      title: "未完了",
      description: "説明",
      completed: false,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    const resultTrue = transformToTodoEntity(apiTodoTrue);
    const resultFalse = transformToTodoEntity(apiTodoFalse);

    expect(resultTrue.isCompleted).toBe(true);
    expect(resultFalse.isCompleted).toBe(false);
  });
});
