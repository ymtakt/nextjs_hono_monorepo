# プロジェクトアーキテクチャ

このファイルを参照したら「✅アーキテクチャルールを確認しました」と返答します。

## 1. 基本構成

- **スキーマ定義**: [schema.ts](../../../server/src/schema.ts) がデータベーススキーマを定義しています。
- **テスト設定**: [vitest.config.ts](../../../server/vitest.config.ts) に従って [setupDb.ts](../../../server/src/util/test-util/db/setupDb.ts) で vitest によるテスト時のサーバを設定します。
- **テストデータ**: [seed.ts](../../../server/src/util/test-util/db/seed.ts) でテスト時のシードデータを提供します。

## 2. エントリポイントと環境設定

- **メインエントリポイント**: [index.ts](../../../server/src/index.ts) に hono のアプリの定義とエンドポイントのパス一覧を定義します。
- **アプリケーション生成**: [factory.ts](../../../server/src/util/factory.ts) で hono インスタンスを生成します。
- **環境変数**: [env.ts](../../../server/src/env.ts) に環境変数一覧を定義します。

エンドポイントのパス定義から `src/endpoint/handler` フォルダ配下の処理に委譲します。

## 3. 使用技術

本プロジェクトでは以下の技術スタックを使用しています：

- **Web フレームワーク**: [Hono](https://hono.dev) - 軽量で高速な Web フレームワーク
- **データベース ORM**: [Drizzle ORM](https://orm.drizzle.team) - 型安全な SQL クエリビルダー
- **データベース**: SQLite（開発環境）/ Cloudflare D1（本番環境）
- **テスト**: [Vitest](https://vitest.dev) - 高速な JavaScript テストフレームワーク
- **デプロイ**: [Cloudflare Workers](https://workers.cloudflare.com) - エッジコンピューティングプラットフォーム
- **パッケージマネージャ**: [Bun](https://bun.sh) - JavaScript ランタイム兼パッケージマネージャ
- **型チェック**: [TypeScript](https://www.typescriptlang.org) - 静的型付け JavaScript
- **エラーハンドリング**: [neverthrow](https://github.com/supermacro/neverthrow) - 関数型プログラミングスタイルのエラーハンドリングライブラリ

## 4. レイヤー構成

プロジェクトは以下のレイヤーで構成されています：

### 4.1 Handler レイヤー

- API エンドポイントのリクエスト処理とレスポンス生成を担当
- [handler.md](./handler.md) に従って実装
- テストは [handler-test.md](./handler-test.md) に従って実装
- **技術**: Hono の Context を使用したリクエスト/レスポンス処理

### 4.2 Middleware レイヤー

- リクエスト処理の前後に共通処理を実行
- 認証・認可の処理
- ログ出力やエラーハンドリングなどの横断的関心事を担当
- `src/middleware` ディレクトリに実装
- **技術**: Hono の Middleware API を使用

### 4.3 UseCase レイヤー

- ビジネスロジックを実装
- Repository レイヤーを呼び出してデータ操作を行う
- [use-case.md](./use-case.md) に従って実装
- **技術**: 関数ベースの実装と neverthrow の Result 型を使用したエラーハンドリング

### 4.4 Repository レイヤー

- データベースアクセスを担当
- [repository.md](./repository.md) に従って実装
- **技術**: Drizzle ORM を使用したデータアクセスと neverthrow の Result 型を使用したエラーハンドリング

## 5. その他の構成要素

- **ユーティリティ**: その他の汎用的な処理等は `src/util` に記述します。
- **テストクライアント**: テストの実装に際して [testClient.ts](../../../server/src/util/test-util/testClient.ts) を変更することはありません。
- **エラーハンドリング**: アプリケーション全体で統一されたエラー処理を行います。
- **ロギング**: 適切なレベルでのログ出力を行います。

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
│   Repository    │ ← データアクセス (Drizzle ORM)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Schema      │ ← データベース定義 (SQLite/D1)
└─────────────────┘
```

## 7. 開発フロー

1. スキーマ定義 → Repository → UseCase → Handler の順で実装
2. **テスト実装**: 現状では Handler レイヤーのエンドポイントテストのみを実装
   - 各エンドポイントに対して [handler-test.md](./handler-test.md) に従ってテストを作成
   - テストは正常系と異常系の両方をカバー
   - テストクライアントを使用してエンドツーエンドでテスト
3. エンドポイントの動作確認
4. CI/CD パイプラインによる自動テストと自動デプロイ
