## API

### 起動方法

`bun run dev`

### vitest

`bun run test`

#### テストの方針

- handler・・・API エンドポイントのテスト（正常・失敗パターン）
- util・・・単一の関数のテスト

### Prisma

prisma generate

`bun run db:generate`

seed.ts の実行

`npx tsx prisma/seed.ts`

### API ドキュメント生成
