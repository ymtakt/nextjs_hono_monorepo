# スキーマ定義ガイド

このファイルを参照したら「✅ スキーマの実装ルールを確認しました」と返答します。

## 1. データベース技術スタック

本プロジェクトでは以下の技術スタックを使用しています：

- **ORM**: [Prisma](https://www.prisma.io) を使用してデータベースアクセスを行います
- **データベース**: PostgreSQL を使用します
- **マイグレーション**: Prisma Migrate を使用してマイグレーションを管理します
- **スキーマ定義**: Prisma Schema Language を使用します
- **テストデータ生成**: @quramy/prisma-fabbrica を使用してファクトリを生成します

## 2. Prisma の基本コマンド

### 2.1 Prisma Client 生成

```bash
# Prisma Clientを生成
bun run db:generate
```

### 2.2 マイグレーション管理

```bash
# マイグレーションをリセット
npx prisma migrate reset

# 新しいマイグレーションを作成
npx prisma migrate dev

# マイグレーションを適用（テスト環境）
npx dotenv -e .env.test -- npx prisma migrate deploy
```

### 2.3 シードデータ

```bash
# シードデータを投入
npx tsx prisma/seed.ts
```

## 3. スキーマ変更の基本手順

スキーマを変更する際は、以下の手順に従ってください：

1. `prisma/schema.prisma` を変更する
2. マイグレーションファイルを生成・適用する

   ```bash
   # マイグレーションファイルを生成
   bun prisma migrate dev --name <変更の説明>

   # または、開発環境でスキーマを直接反映（マイグレーションファイルなし）
   bun prisma db push
   ```

3. Prisma Client を再生成する

   ```bash
   bun prisma generate
   ```

4. テストデータのファクトリを更新する
   ```bash
   bun prisma-fabbrica generate
   ```

## 3. スキーマ定義のガイドライン

### 3.1 モデル定義

- モデル名は単数形で定義する（例: `User`, `Todo`）
- テーブル名は複数形で定義する（`@@map`を使用）
- 関連モデルは適切なリレーション定義を使用する
- モデル定義は論理的なグループごとにまとめる

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  todos     Todo[]

  @@map("users")
}

model Todo {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  completed   Boolean  @default(false)
  userId      Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("todos")
}
```

### 3.2 フィールド定義

- ID フィールドは `id` という名前で定義し、主キーとする（`@id`）
- 作成日時・更新日時は `createdAt`/`updatedAt` という名前で定義する
- 外部キーは `<モデル名>Id` という名前で定義する（例: `userId`）
- 必須項目には型定義のみを記述（オプショナルな項目には `?` を付ける）
- ユニーク制約が必要な項目には `@unique` を付ける
- リレーションには適切な参照アクション設定を行う（例: `onDelete: Cascade`）

### 3.3 インデックス定義

- 検索条件としてよく使われるフィールドにはインデックスを設定する
- 複合インデックスは関連する検索パターンに合わせて設定する
- Prisma の `@@index` 属性を使用してインデックスを定義する

```prisma
model Post {
  id          Int       @id @default(autoincrement())
  title       String
  authorId    Int
  categoryId  Int?
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([authorId, publishedAt])
  @@index([categoryId, publishedAt])
}
```

## 4. テストデータ生成

テストデータは @quramy/prisma-fabbrica を使用して生成します：

```typescript
// generated/fabbrica/Todo.ts の使用例
import { createTodoFactory } from "../generated/fabbrica";

const todoFactory = createTodoFactory();

// 単一のTodoを生成
const todo = await todoFactory.create();

// 複数のTodoを生成
const todos = await todoFactory.createList(3);

// 関連を含むTodoを生成
const todoWithUser = await todoFactory.create({
  user: {
    email: "test@example.com",
    name: "Test User",
    password: "hashedPassword",
  },
});
```

## 5. マイグレーション管理

- マイグレーションファイルは Prisma Migrate によって自動生成される
- マイグレーションファイルは `prisma/migrations` ディレクトリに保存される
- マイグレーションファイルを手動で編集しない
- 本番環境へのデプロイ前に必ずマイグレーションをテスト環境で検証する
- マイグレーションコマンドは `package.json` に定義されている

```json
{
  "scripts": {
    "prisma:migrate:dev": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:generate": "prisma generate",
    "prisma:studio": "prisma studio"
  }
}
```

## 6. スキーマ変更チェックリスト

スキーマ変更時は以下の点を確認してください：

- [ ] モデル名・フィールド名が命名規則に従っているか
- [ ] テーブル名が`@@map`で適切に設定されているか
- [ ] 適切な型とモディファイア（必須/オプショナル）が設定されているか
- [ ] リレーションが適切に設定されているか
- [ ] 必要なインデックスが設定されているか
- [ ] マイグレーションが正常に生成・適用できるか
- [ ] Prisma Client が正常に生成されるか
- [ ] テストデータのファクトリが正常に生成されるか
- [ ] 既存のクエリに影響がないか確認したか
- [ ] Repository レイヤーの対応するコードを更新したか
