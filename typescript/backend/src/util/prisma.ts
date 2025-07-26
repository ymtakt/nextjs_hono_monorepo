import { PrismaClient } from "../../generated/client";

// declare global {
//   var __prisma: PrismaClient | undefined;
// }

// export const prisma = globalThis.__prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production") {
//   globalThis.__prisma = prisma;
// }

// 環境に応じてPrismaクライアントを作成
function createPrismaClient() {
  console.log("🔧 Creating PrismaClient with:");
  console.log("  NODE_ENV:", process.env.NODE_ENV);
  console.log("  DATABASE_URL:", process.env.DATABASE_URL);
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
    // テスト環境では確実に現在の環境変数を使用
    ...(process.env.NODE_ENV === "test" && {
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    }),
  });
}

// グローバルなPrismaクライアント
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  process.env.NODE_ENV === "test"
    ? createPrismaClient() // テスト時は毎回新しく作成
    : globalThis.__prisma ?? createPrismaClient(); // 他は使い回し

// 開発環境でのホットリロード対応
if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

// テスト環境でのクリーンアップ用
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

// テスト用データリセット関数
export const resetTestData = async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("resetTestData can only be called in test environment");
  }

  // テスト時は新しいクライアントインスタンスを作成
  const testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    // 外部キー制約を考慮した順序で削除
    await testPrisma.user.deleteMany();
    await testPrisma.todo.deleteMany();
  } finally {
    await testPrisma.$disconnect();
  }
};
