# プロジェクトアーキテクチャ

## 1. 基本構成

- **スキーマ定義**: `prisma/schema.prisma` がデータベーススキーマを定義しています。
- **テスト設定**: `vitest.config.ts` に従って `src/util/test-util/setup.ts` で vitest によるテスト時のサーバを設定します。
- **テストデータ**: `prisma/seed.ts` でテスト時のシードデータを提供します。

## 2. エントリポイントと環境設定

- **メインエントリポイント**: `src/index.ts` に hono のアプリの定義とエンドポイントのパス一覧を定義します。
- **アプリケーション生成**: `src/util/factory.ts` で hono インスタンスを生成します。
- **環境変数**: `src/env.ts` に環境変数一覧を定義します。

エンドポイントのパス定義から `src/endpoint/handler` フォルダ配下の処理に委譲します。

## 3. 使用技術

本プロジェクトでは以下の技術スタックを使用しています：

- **Web フレームワーク**: [Hono](https://hono.dev) - 軽量で高速な Web フレームワーク
- **データベース ORM**: [Prisma](https://www.prisma.io) - 型安全な ORM
- **テスト**: [Vitest](https://vitest.dev) - 高速な JavaScript テストフレームワーク
- **パッケージマネージャ**: [Bun](https://bun.sh) - JavaScript ランタイム兼パッケージマネージャ
- **型チェック**: [TypeScript](https://www.typescriptlang.org) - 静的型付け JavaScript

## 4. レイヤー構成

プロジェクトは以下のレイヤーで構成されています：

### 4.1 Handler レイヤー (`src/endpoint/handler/`)

- API エンドポイントのリクエスト処理とレスポンス生成を担当
- リクエストのバリデーション
- use-case の呼び出し
- レスポンスの整形
- **技術**: Hono の Context を使用したリクエスト/レスポンス処理

### 4.2 Middleware レイヤー (`src/endpoint/middleware/`)

- リクエスト処理の前後に共通処理を実行
- 認証・認可の処理
- グローバルエラーハンドリング
- リクエスト ID の生成
- **技術**: Hono の Middleware API を使用

### 4.3 UseCase レイヤー (`src/use-case/`)

- ビジネスロジックを実装
- Repository レイヤーを呼び出してデータ操作を行う
- トランザクション管理
- ドメインルールの適用
- **技術**: 関数ベースの実装

### 4.4 Repository レイヤー (`src/repository/`)

- データベースアクセスを担当
- CQRS（Command Query Responsibility Segregation）パターンの採用
  - `mutation/`: データ変更操作
  - `query/`: データ取得操作
- **技術**: Prisma Client を使用したデータアクセス

## 5. その他の構成要素

- **ユーティリティ**: `src/util/` に共通機能を実装
  - ファクトリー関数
  - ロガー
  - テストユーティリティ
- **シードデータ**: `prisma/seed.ts` でデータベースの初期データを管理
- **マイグレーション**: `prisma/migrations/` でデータベースのスキーマ変更を管理
- **テストクライアント**: `src/util/test-util/testClient.ts` でテスト用の HTTP クライアントを提供

## 6. アーキテクチャ図

```txt
┌─────────────────┐
│     index.ts    │ ← エントリポイント (Hono)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Middleware    │ ← 認証・認可、共通処理
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Handler     │ ← API リクエスト/レスポンス処理
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    UseCase      │ ← ビジネスロジック
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Repository    │ ← データアクセス (Prisma)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  schema.prisma  │ ← データベース定義
└─────────────────┘
```

## 7. 開発フロー

1. スキーマ定義（`schema.prisma`）→ Repository → UseCase → Handler の順で実装
2. **テスト実装**: Handler レイヤーのエンドポイントテストを実装
   - 各エンドポイントに対してテストを作成
   - テストは正常系と異常系の両方をカバー
   - テストクライアントを使用してエンドツーエンドでテスト
3. エンドポイントの動作確認
4. データベースマイグレーションの管理

## 8. データフロー例

Todo 作成の場合：

```txt
1. POST /api/todos
2. setUserAuthMiddleware で認証チェック
3. createTodoHandler でリクエスト処理
4. createTodoUseCase でビジネスロジック実行
5. createTodo でデータベース操作
6. Prismaクライアントによるデータベース更新
```
