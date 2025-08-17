# nextjs hono monorepo プロジェクト

Next.js と Hono を使用したモノレポプロジェクトです。

## 環境要件

- Node.js: v22.7.0 以上
- npm: v10.8.2 以上
- Next.js: v15.2.4

## モノレポツール

bun workspace

## 環境構築

```bash
# パッケージインストール
bun install

# 開発サーバー起動
bun run dev
```

## 主要コマンド

| コマンド      | 説明                                              |
| ------------- | ------------------------------------------------- |
| `bun run dev` | 開発サーバーを起動します（http://localhost:3000） |

## フォルダ構成

```
.
├── docs/                     # プロジェクトドキュメント
│   └── rules/               # 実装ルール
│       ├── frontend/        # フロントエンド実装ルール
│       └── server/          # バックエンド実装ルール
├── typescript/              # TypeScriptプロジェクト
│   ├── frontend/           # フロントエンドアプリケーション
│   └── backend/           # バックエンドアプリケーション
└── package.json           # ワークスペース設定
```

## 開発環境設定

### Biome

このプロジェクトでは、コード品質の維持とフォーマットの統一のために [Biome](https://biomejs.dev/) を採用しています。

#### セットアップ

1. VSCode 拡張機能のインストール

   - [Biome 拡張機能](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
   - デフォルトフォーマッターとして設定

2. 設定ファイル
   - ルート: 共通設定（インデント、行幅など）
   - フロントエンド: Next.js 向けの設定（セミコロン必須、any 型禁止など）
   - バックエンド: Hono 向けの設定（セミコロン任意、forEach メソッド禁止など）

#### 主要コマンド

- `bun x @biomejs/biome format --write .`: フォーマット実行
- `bun x @biomejs/biome lint .`: リントチェック
- `bun x @biomejs/biome check --write .`: フォーマット＆リント実行

※ 特定のディレクトリのみを対象とする場合は、`.` の代わりにパスを指定（例：`typescript/frontend/`）

詳細な設定内容は [Biome ドキュメント](https://biomejs.dev/) を参照してください。

## アーキテクチャ

### フロントエンド

Next.js App Router を採用し、以下の設計原則に基づいています：

1. **レイヤードアーキテクチャ**

   - ページコンポーネント（SSR）
   - クライアントページ（画面固有の実装）
   - 機能なし/機能ありコンポーネント（再利用可能な UI）
   - ドメインロジック（ビジネスロジック）
   - API サービス（外部通信）

2. **エラーハンドリング**

   - Result 型による統一的なエラー処理
   - 適切なエラー表示（toast、フィールドエラー）

3. **状態管理**
   - Server Action によるフォーム処理
   - React Hooks によるローカル状態管理

詳細な実装ルールは [フロントエンドドキュメント](./docs/rules/frontend/architecture.md) を参照してください。

### バックエンド

Hono を採用し、以下の設計原則に基づいています：

1. **レイヤードアーキテクチャ**

   - Handler（エンドポイント）
   - UseCase（ビジネスロジック）
   - Repository（データアクセス）

2. **データベース**
   - Prisma ORM
   - PostgreSQL

詳細な実装ルールは [バックエンドドキュメント](./docs/rules/server/architecture.md) を参照してください。

## 開発フロー

1. 実装前に関連するドキュメントを確認
2. 実装ルールに従ってコードを作成
3. Biome によるコード品質チェック
4. テストの実装と実行
5. PR の作成とレビュー

## 参考ドキュメント

- [フロントエンド アーキテクチャ](./docs/rules/frontend/architecture.md)
- [バックエンド アーキテクチャ](./docs/rules/server/architecture.md)
- [共通ルール](./docs/rules/frontend/always-applied-rules.md)
