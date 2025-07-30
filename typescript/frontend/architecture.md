# フロントエンドアーキテクチャ

## 概要

このフロントエンドプロジェクトは、クリーンアーキテクチャの考え方を基にした設計を採用しています。
コードの依存関係を明確にし、テスタビリティと保守性を高めることを目的としています。

## アーキテクチャ構成

```
src/
├── app/                    # ページコンポーネント (Next.js)
├── components/
│   ├── functional/         # ビジネスロジックを含むコンポーネント
│   └── functionless/       # 純粋な表示用コンポーネント
├── core/                   # コアロジック
│   └── services/          # 外部APIとの通信を担当
├── logic/
│   ├── data/              # データ型定義
│   ├── hooks/             # カスタムフック
│   └── use-case/          # ユースケース実装
└── utils/                 # ユーティリティ関数
```

## 依存の方向

依存関係は以下の方向に制限されています：

```
app → components/functional → logic/use-case → core/services
                            ↘              ↘
                             components/functionless
```

- 外側のレイヤーは内側のレイヤーに依存可能
- 内側のレイヤーは外側のレイヤーに依存してはいけない
- `components/functionless`は純粋な UI コンポーネントとして、どのレイヤーからも利用可能

## 各フォルダの役割

### app/

- Next.js のページコンポーネントを配置
- ルーティングの定義
- レイアウトの管理
- エラーハンドリング

### components/

#### functional/

- ビジネスロジックを含むコンポーネント
- use-case や services の呼び出し
- データの加工や状態管理
- 例：TodoList, TodoForm 等

#### functionless/

- 純粋な表示用コンポーネント
- props を受け取って表示するのみ
- ビジネスロジックを含まない
- 例：Modal, Loading 等

### core/

#### services/

- 外部 API との通信を担当
- API クライアントの実装
- データの永続化層

### logic/

#### data/

- 型定義
- インターフェース定義
- モデルの定義

#### hooks/

- React Hooks の実装
- 再利用可能な状態管理ロジック
- UI に関連する共通ロジック

#### use-case/

- ビジネスロジックの実装
- services の利用
- データの加工や検証

### utils/

- 汎用的なユーティリティ関数
- 日付フォーマット
- エラーハンドリング
- etc.

## テスト方針

### テストの種類と配置

1. **ユニットテスト**

   - `__test__/`ディレクトリ配下に配置
   - 各機能ごとにテストファイルを作成
   - テストファイル名は`.test.ts(x)`で終わる

2. **テスト対象**

   - core/services: API との通信テスト
   - logic/hooks: カスタムフックの動作テスト
   - logic/use-case: ビジネスロジックのテスト
   - components/functional: コンポーネントの統合テスト
   - utils: ユーティリティ関数のテスト

3. **テストの優先順位**
   - ビジネスロジック（use-case）を最優先
   - 再利用性の高いコンポーネントやフック
   - ユーティリティ関数
   - UI コンポーネント

### テストの方針

1. **単体テスト**

   - 各関数、フックの独立したテスト
   - モックを活用して外部依存を分離
   - エッジケースの網羅

2. **コンポーネントテスト**

   - レンダリングの確認
   - ユーザーインタラクションのテスト
   - プロップスの検証

3. **統合テスト**
   - コンポーネント間の連携
   - データフローの検証
   - エラーハンドリングの確認

## Hono モノレポにおける特徴

### API クライアント構成

```
core/services ← logic/hooks ← components/functional
    ↓
Hono/Client(RPC)
    ↓
バックエンド
```

- Next.js の Server Actions や Route Handler は使用しない
- すべての通信は Hono/Client の RPC を介して行う
- 通信処理は`core/services`層に閉じ込める

### レイヤー別の責務

#### core/services

- Hono/Client の RPC を利用した通信処理
- DTO の型定義に基づいたレスポンス型の提供
- 外部通信エラーをそのまま上位層に伝播
- ビジネスロジックを持たない純粋な通信層
- `logic/hooks`からのみ呼び出される

```typescript
// core/services/todo.service.ts の例
export const todoService = {
  async getTodos(): Promise<TodoDTO[]> {
    return client.api.todos.$get();
  },
  // ...
};
```

#### logic/hooks

- services の呼び出しを担当
- DTO から Entity への変換処理
- クライアントサイドのバリデーション
- アプリケーション固有のエラーハンドリング
- UI の状態管理

```typescript
// logic/hooks/useTodos.ts の例
export const useTodos = () => {
  const { data, error } = useSWR("todos", () =>
    todoService
      .getTodos()
      .then((dtos) => dtos.map(convertToEntity))
      .catch(handleApiError)
  );
  // ...
};
```

#### components/functional

- hooks 層を利用したデータフェッチ
- UI ロジックの実装
- エラー表示やローディング状態の管理
- ユーザーインタラクションのハンドリング

```typescript
// components/functional/todo/TodoList.tsx の例
export const TodoList = () => {
  const { todos, isLoading, error } = useTodos();

  if (isLoading) return <Loading />;
  if (error) return <ErrorDisplay error={error} />;

  return <TodoListView todos={todos} />;
};
```

### エラーハンドリング戦略

1. **サービス層**

   - 外部通信エラーをそのまま伝播
   - エラーの型情報は保持

2. **ロジック層**

   - 外部エラーをアプリケーションエラーに変換
   - エラーメッセージの整形
   - 再試行ロジックの実装

3. **コンポーネント層**
   - ユーザーへのエラー表示
   - エラーバウンダリの設定
   - リカバリーアクションの提供

### バリデーション戦略

1. **クライアントサイド（logic/hooks）**

   - ユーザー入力の即時バリデーション
   - 形式的なチェック（必須、文字数など）
   - API コール前の事前検証

2. **サーバーサイド**
   - ビジネスルールの検証
   - データ整合性の確認
   - 権限チェック

## 開発フロー

1. **新機能追加時**

   ```
   1. DTOの型定義
   2. services層のAPI実装
   3. hooks層での変換処理実装
   4. コンポーネントでの表示実装
   ```

2. **エラーハンドリング実装時**
   ```
   1. サービス層でのエラー型定義
   2. hooks層でのエラー変換
   3. コンポーネントでのエラー表示
   ```

## 開発ガイドライン

1. 新機能の追加時は、まず use-case とテストを実装
2. UI コンポーネントは可能な限り functionless に分離
3. ビジネスロジックは use-case に集中させる
4. 共通機能は hooks として実装
5. 外部通信は必ず services を経由
