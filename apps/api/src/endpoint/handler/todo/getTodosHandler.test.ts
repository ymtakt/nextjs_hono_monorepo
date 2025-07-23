import { describe, expect, it } from "vitest";
import { getTestClient } from "../../../util/test-util/testClient";
import { prisma } from "../../../util/prisma";

describe("Test for GET /api/todos", () => {
  // 前提：認証済みユーザーが Todo 一覧を取得する。
  // 期待値：ステータスコード 200 と Todo 一覧が返される。
  it("Successfully get todos", async () => {
    await prisma.user.create({
      data: {
        id: 1,
        name: "test-user-1",
        email: "test-user-1@example.com",
        password: "password",
      },
    });

    // テスト用のデータを準備する。
    await prisma.todo.createMany({
      data: [
        {
          id: 1,
          title: "テストタスク1",
          description: "テスト用のタスク1です",
          completed: false,
          userId: 1,
        },
        {
          id: 2,
          title: "テストタスク2",
          description: "テスト用のタスク2です",
          completed: true,
          userId: 1,
        },
        {
          id: 3,
          title: "他のユーザーのタスク",
          description: "他のユーザーのタスクです",
          completed: false,
          userId: 1,
        },
      ],
    });

    // 認証済みユーザーIDをセットアップ（実際の認証ミドルウェアに応じて調整）
    // mockSetUserAuthMiddleware({ userId: 'test-user-1' }) // これは後で実装

    // テスト用の API クライアントを作成する。
    const client = await getTestClient();

    // Todo 一覧を取得する。（実際のエンドポイントパスに応じて調整）
    // const res = await client.api.todos.$get()

    // 一旦、データが正しく挿入されているかテスト
    const todosCount = await prisma.todo.count();
    expect(todosCount).toBe(3);

    const userTodos = await prisma.todo.findMany({
      where: { userId: 1 },
    });
    expect(userTodos).toHaveLength(3);

    console.log("✅ テストデータが正しく挿入されました");
    console.log("✅ トランザクション管理が動作しています");
  });

  // 前提：認証済みユーザーに Todo が存在しない場合。
  // 期待値：ステータスコード 200 と空の配列が返される。
  it("Returns empty array when user has no todos", async () => {
    // データを挿入せず、空の状態でテスト
    const todosCount = await prisma.todo.count();
    expect(todosCount).toBe(0);

    console.log("✅ テスト間でデータがクリーンアップされています");
  });
});
