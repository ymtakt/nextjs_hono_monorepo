import { describe, it, expect } from "vitest";
import { mockSetUserAuthMiddleware } from "../../../util/test-util/mockSetUserAuthMiddleware";
import { prisma } from "../../../util/prisma";
import { client } from "../../../util/test-util/testClient";

describe("deleteTodoHandler - 正常系", () => {
  it("指定されたTodoを正常に削除できる", async () => {
    // ユーザー情報をセットする
    mockSetUserAuthMiddleware({ userId: 1 });

    // テスト用のTodoを作成
    await prisma.todo.create({
      data: {
        id: 456,
        title: "削除対象Todo",
        description: "削除されるTodo",
        userId: 1,
        completed: false,
      },
    });

    const res = await client.api.todos[":todoId"].$delete({
      param: { todoId: "456" },
    });

    if (res.status !== 200) throw new Error("Todo削除に失敗しました");

    expect(res.status).toBe(200);

    // データベースから削除されているか確認
    const deletedTodo = await prisma.todo.findUnique({
      where: { id: 456 },
    });
    expect(deletedTodo).toBeNull();
  });
});
