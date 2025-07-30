## API

## 起動方法

`bun run dev`

## Prisma

### prisma generate

`bun run db:generate`

### seed.ts の実行

`npx tsx prisma/seed.ts`

### マイグレーション作成

`npx prisma　migrate reset`
↓
`npx prisma migrate dev`

### マイグレーションの適用

`npx dotenv -e .env.test -- npx prisma migrate deploy`

## テストの方針

- handler・・・API エンドポイントのテスト（正常・失敗パターン）
- util・・・単一の関数のテスト

### vitest

`bun run test`

# テスト実行手順

## 前提条件

- Docker が起動していること
- 開発環境でマイグレーションが作成済みであること（`prisma/migrations/`にファイルが存在）

## テスト実行の流れ

### 1. テスト用データベースを起動する

```bash
docker compose -f compose.test.yml up -d
```

<!-- ### 2. 最新のマイグレーションを元に DB を更新する

```bash
dotenv -e .env.test -- npx prisma migrate deploy
``` -->

### 3. テストを実行する

```bash
bun run test
```

### 4. テスト用データベースを停止する（任意）

```bash
docker compose -f compose.test.yml down
```

## API ドキュメント生成
