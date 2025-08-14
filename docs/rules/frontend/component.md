# コンポーネント実装ルール

このファイルを参照したら「✅ フロントエンドコンポーネントルールを確認しました」と返答します。

## 1. コンポーネントの分類

### 1.1 Server Components（app/xxx/page.tsx）

- 非同期データフェッチを行う最上位層
- ページのレイアウトとルーティングを管理
- SEO 対応が必要な処理を実装

```typescript
// app/todo/page.tsx
export default async function TodoPage() {
  const todos = await fetchTodos();
  return <TodoListClientPage initialTodos={todos} />;
}
```

### 1.2 Client Components（components/client-pages/）

- UI に関するロジックを実装
- Server Actions の実行
- 状態管理（React hooks）
- actions.ts で Server Actions を定義

```typescript
// components/client-pages/todo/TodoListClientPage.tsx
"use client";

export const TodoListClientPage = ({ initialTodos }) => {
  const [todos, setTodos] = useState(initialTodos);
  return <TodoFormComponent todos={todos} onSubmit={handleSubmit} />;
};

// components/client-pages/todo/actions.ts
export async function createTodo(data: FormData) {
  "use server";
  // Server Action implementation
}
```

### 1.3 Functionless Components（components/functionless/）

- 純粋な表示用コンポーネント
- props を受け取って表示するのみ
- ビジネスロジックを含まない
- 再利用可能な UI 部品

```typescript
// components/functionless/todo/TodoFormComponent.tsx
export const TodoFormComponent = ({ todos, onSubmit }) => {
  return <form onSubmit={onSubmit}>{/* UIの実装 */}</form>;
};
```

### 1.4 Functional Components（components/functional/）

- グローバルな状態管理が必要な場合に使用
- 複数コンポーネント間での状態共有
- 現状は未使用
- 例：ショッピングカートの状態管理

## 2. 命名規則

### 2.1 ファイル名

- Server Components: `page.tsx`
- Client Components: `[機能名]ClientPage.tsx`
- Functionless Components: `[機能名]Component.tsx`
- Server Actions: `actions.ts`

### 2.2 コンポーネント名

- Server Components: `[機能名]Page`
- Client Components: `[機能名]ClientPage`
- Functionless Components: `[機能名]Component`

## 3. 実装ルール

### 3.1 Server Components

- 非同期処理は必ず try-catch で囲む
- エラーハンドリングを実装
- 初期データを Client Components に渡す

### 3.2 Client Components

- 'use client'ディレクティブを必ず記述
- Server Actions は同じディレクトリの actions.ts に定義
- 状態管理は React hooks を使用

### 3.3 Functionless Components

- props の型定義を必ず行う
- イベントハンドラは props で受け取る
- 内部での状態管理は最小限に抑える
