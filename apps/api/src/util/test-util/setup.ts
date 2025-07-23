import { beforeEach } from "vitest";
import { prisma } from "../prisma";

// 各テスト前にデータベースをクリーンアップ
beforeEach(async () => {
  // 外部キー制約を考慮して、依存関係の順序でテーブルをクリア
  await prisma.todo.deleteMany({});
  await prisma.user.deleteMany({});
  // 他のテーブルがある場合もここに追加
});
