# プロジェクトアーキテクチャ

このファイルを参照したら「✅ フロントエンドアーキテクチャルールを確認しました」と返答します。

## 1. Next.js の基本構成

### 1.1 特殊ファイル

- `layout.tsx`: 複数のページで共有される UI を定義

  ```typescript
  // app/layout.tsx
  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          {/* プロバイダーの設定 */}
          <Providers>
            <header>共通ヘッダー</header>
            {children}
            <footer>共通フッター</footer>
          </Providers>
        </body>
      </html>
    );
  }
  ```

- `error.tsx`: エラーハンドリングの UI

  ```typescript
  // app/error.tsx
  "use client";

  export default function Error({ error, reset }) {
    return (
      <div>
        <h2>エラーが発生しました</h2>
        <p>{error.message}</p>
        <button onClick={() => reset()}>再試行</button>
      </div>
    );
  }
  ```

- `loading.tsx`: ローディング状態の UI

  ```typescript
  // app/loading.tsx
  export default function Loading() {
    return <div>読み込み中...</div>;
  }
  ```

- `not-found.tsx`: 404 ページの UI
  ```typescript
  // app/not-found.tsx
  export default function NotFound() {
    return <div>ページが見つかりません</div>;
  }
  ```

### 1.2 階層ごとの使い分け

#### ルートレベル（app/）

- `layout.tsx`: アプリケーション全体の共通レイアウト
  - プロバイダーの設定
  - 共通のヘッダー/フッター
  - メタデータの設定
- `error.tsx`: アプリケーション全体のエラーハンドリング
- `loading.tsx`: アプリケーション全体のローディング状態
- `not-found.tsx`: 404 ページ

#### グループレベル（app/(group)/）

- `layout.tsx`: グループ固有のレイアウト
  - グループ固有のナビゲーション
  - グループ固有のプロバイダー
- `error.tsx`: グループ固有のエラーハンドリング
- `loading.tsx`: グループ固有のローディング状態

#### ページレベル（app/(group)/xxx/）

- `page.tsx`: ページコンポーネント
  - データフェッチ
  - メタデータ設定
- `error.tsx`: ページ固有のエラーハンドリング
- `loading.tsx`: ページ固有のローディング状態

### 1.3 プロバイダーの種類と用途

```typescript
// app/providers.tsx
export function Providers({ children }) {
  return (
    <ThemeProvider>
      {" "}
      {/* テーマ設定（ダークモードなど） */}
      <AuthProvider>
        {" "}
        {/* 認証状態の管理 */}
        <QueryClientProvider>
          {" "}
          {/* APIレスポンスのキャッシュ管理 */}
          <ToastProvider>
            {" "}
            {/* トースト通知の管理 */}
            <ModalProvider>
              {" "}
              {/* モーダルの管理 */}
              {children}
            </ModalProvider>
          </ToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

#### 主なプロバイダー

1. アプリケーション全体（layout.tsx）

   - テーマプロバイダー
   - 認証プロバイダー
   - API キャッシュプロバイダー
   - トースト通知プロバイダー
   - モーダルプロバイダー

2. グループレベル（(group)/layout.tsx）

   - グループ固有の状態プロバイダー
   - 機能固有のコンテキストプロバイダー

3. ページレベル（xxx/layout.tsx）
   - ページ固有の状態プロバイダー
   - フォーム状態のプロバイダー

### 1.4 ルーティング構造

```
app/
  ├── layout.tsx      # 共通レイアウト
  ├── error.tsx       # エラーハンドリング
  ├── loading.tsx     # ローディング状態
  ├── not-found.tsx   # 404ページ
  ├── page.tsx        # トップページ
  └── (todo)/         # ルーティンググループ
      ├── layout.tsx  # グループ共通レイアウト
      ├── page.tsx    # /todo ページ
      └── [id]/       # 動的ルーティング
          └── page.tsx # /todo/[id] ページ
```

## 2. 基本構成

- **Server Components**: `app/` ディレクトリ配下で App Router ベースのページを定義

  - 非同期データフェッチを行う最上位層
  - ページのレイアウトとルーティングを管理
  - 例：`app/xxx/page.tsx`

- **Client Components**: `components/client-pages/` ディレクトリ配下でクライアントサイドの処理を行うコンポーネントを定義

  - UI に関するロジックを実装
  - Server Actions の実行
  - 状態管理
  - 例：`components/client-pages/todo/TodoListClientPage.tsx`

- **Functionless Components**: `components/functionless/` ディレクトリ配下で純粋な表示用コンポーネントを定義

  - props を受け取って表示するのみ
  - ビジネスロジックを含まない
  - 例：`components/functionless/todo/TodoFormComponent.tsx`

- **Functional Components**: `components/functional/` ディレクトリ配下でグローバルな状態管理を行うコンポーネントを定義
  - グローバルな状態管理が必要な場合に使用
  - 例：ショッピングカートの状態管理

## 3. ディレクトリ構造

```
src/
├── app/                    # Server Components
│   ├── layout.tsx         # ルートレイアウト
│   ├── error.tsx          # エラーハンドリング
│   ├── loading.tsx        # ローディング状態
│   └── (todo)/            # ルーティンググループ
│       ├── layout.tsx     # グループレイアウト
│       ├── error.tsx      # グループエラー
│       ├── loading.tsx    # グループローディング
│       ├── page.tsx       # トップページ
│       └── [id]/          # 動的ルーティング
│           └── page.tsx   # 詳細ページ
├── components/
│   ├── client-pages/      # Client Components
│   │   └── todo/
│   │       ├── actions.ts # Server Actions
│   │       └── TodoListClientPage.tsx
│   ├── functional/        # 状態管理コンポーネント
│   └── functionless/      # 純粋表示コンポーネント
│       └── todo/
│           └── TodoFormComponent.tsx
├── core/                  # APIクライアント
├── logic/                 # ビジネスロジック
└── utils/                 # ユーティリティ
```

## 4. レイヤー構成

### 4.1 Server Components 層

- Next.js App Router を使用したページコンポーネント
- サーバーサイドでのデータフェッチ
- レイアウトとルーティングの管理
- SEO 対応

### 4.2 Client Components 層

- クライアントサイドのロジック実装
- Server Actions の定義と実行
- 状態管理（React hooks）
- UI イベントハンドリング

### 4.3 Functionless Components 層

- 純粋な表示用コンポーネント
- props による動作の制御
- 再利用可能な UI 部品
- ビジネスロジックを含まない

### 4.4 Functional Components 層

- グローバルな状態管理
- 複数コンポーネント間での状態共有
- 現状は未使用

## 5. データフロー

```
Server Components (データフェッチ)
         ↓
Client Components (状態管理・アクション)
         ↓
Functionless Components (表示)
```

## 6. 実装方針

### 6.1 Server Components

```typescript
// app/todo/page.tsx
export default async function TodoPage() {
  // データフェッチ
  const todos = await fetchTodos();

  return <TodoListClientPage initialTodos={todos} />;
}
```

### 6.2 Client Components

```typescript
// components/client-pages/todo/TodoListClientPage.tsx
"use client";

export const TodoListClientPage = ({ initialTodos }) => {
  const [todos, setTodos] = useState(initialTodos);
  const handleSubmit = () => {};

  return <TodoFormComponent todos={todos} onSubmit={handleSubmit} />;
};
```

### 6.3 Functionless Components

```typescript
// components/functionless/todo/TodoFormComponent.tsx
export const TodoFormComponent = ({ todos, onSubmit }) => {
  return <form onSubmit={onSubmit}>{/* UIの実装 */}</form>;
};
```

## 7. データフェッチと Server Actions

### 7.1 Server Actions の基本構造

```typescript
// components/client-pages/todo/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/utils/actions";

// バリデーションスキーマ
const todoActionFormSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().min(1, "説明は必須です"),
});

// ActionState型の定義
export type TodoFormActionState = ActionState<
  TodoFormFields,
  TodoValidationErrors
>;

// Server Action
export async function createTodoAction(
  prevState: TodoFormActionState,
  formData: FormData
): Promise<TodoFormActionState> {
  const formFields = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
  };

  // バリデーション
  const validationResult = todoActionFormSchema.safeParse(formFields);
  if (!validationResult.success) {
    return {
      ...formFields,
      status: "error",
      validationErrors: validationResult.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.todo.create({
      data: validationResult.data,
    });
    revalidatePath("/");
    return { status: "success" };
  } catch (error) {
    return {
      ...formFields,
      status: "error",
      error: "Todo作成に失敗しました",
    };
  }
}
```

### 7.2 Client Components での使用

```typescript
// components/client-pages/todo/TodoListClientPage.tsx
"use client";

import { useServerActionWrapper } from "@/utils/hooks/useServerActionWrapper";
import { createTodoAction } from "./actions";

export function TodoListClientPage({ todos }: { todos: TodoEntity[] }) {
  // Server Actionのラッパーフック
  const wrappedAction = useServerActionWrapper(createTodoAction, {
    onSuccess: () => {
      // 成功時の処理
    },
  });

  const [_, action, isPending] = useActionState(wrappedAction, initialState);

  return <form action={action}>{/* フォームの実装 */}</form>;
}
```

### 7.3 データフローの関係性

```
1. Server Components (app/xxx/page.tsx)
   ↓
   初期データフェッチ（prisma直接利用）
   ↓
2. Client Components (components/client-pages/xxx)
   ↓
   useServerActionWrapper + useActionState
   ↓
3. Server Actions (actions.ts)
   ↓
   バリデーション → DB操作 → revalidatePath
```

### 7.4 実装の使い分け

1. Server Components

   - 初期データの取得
   - SEO が必要なデータ
   - ページロード時に必要なデータ

2. Server Actions

   - フォーム送信
   - データの作成・更新・削除
   - バリデーション処理

3. useServerActionWrapper + useActionState
   - ローディング状態の管理
   - エラーハンドリング
   - 成功時の処理

### 7.6 実装例

```

```

## 8. Use Case の設計

### 8.1 基本原則

- ビジネスロジックの実装
- service ファイルを使用した外部通信（例：API クライアント）
- エンティティの変換処理
- エラーハンドリング

### 8.2 実装ルール

- React が出てこない
- ロジックに View の概念は出てこない
- アプリの言葉や知識が出てくる（Entity）
- Entity の操作（書き込み、保存、配列操作などの計算）
- 外部通信をモックで置き換え可能な状態

### 8.3 エンティティ変換

```typescript
// logic/use-case/todo.use-case.ts
export const transformToTodoEntity = (todoObject: {
  title: string;
  description: string;
  completed: boolean;
  id: number;
  createdAt: string;
  updatedAt: string;
}): TodoEntity => ({
  id: todoObject.id,
  title: todoObject.title,
  description: todoObject.description || "",
  isCompleted: todoObject.completed,
  createdDate: todoObject.createdAt,
  updatedDate: todoObject.updatedAt || todoObject.createdAt,
});
```

### 8.4 エラー処理

#### エラーコード定義

```typescript
// utils/errors.ts
const API_EXTERNAL_ERROR_CODES = {
  BASE: {
    NETWORK_ERROR: "NETWORK_ERROR",
    SERVER_ERROR: "SERVER_ERROR",
  },
  API_TODO: {
    NOT_FOUND: "TODO_NOT_FOUND",
    FETCH_FAILED: "TODO_FETCH_FAILED",
    CREATE_FAILED: "TODO_CREATE_FAILED",
    // ...
  },
};

const SERVER_ACTION_ERROR_CODES = {
  ACTION_TODO: {
    ID_NOT_FOUND: "TODO_ID_NOT_FOUND",
    FORM_DATA_INVALID: "FORM_DATA_INVALID",
    // ...
  },
};

export const ERROR_CODES = {
  ...API_EXTERNAL_ERROR_CODES,
  ...SERVER_ACTION_ERROR_CODES,
};
```

#### エラーメッセージ

```typescript
const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  [ERROR_CODES.BASE.NETWORK_ERROR]: "ネットワークエラーが発生しました",
  [ERROR_CODES.BASE.SERVER_ERROR]: "サーバーエラーが発生しました",
  [ERROR_CODES.API_TODO.NOT_FOUND]: "Todoが見つかりませんでした",
  // ...
};
```

#### アプリケーションエラー

```typescript
export class ApplicationError extends Error {
  constructor(code: AppErrorCode, public readonly originalError?: unknown) {
    super(ERROR_MESSAGES[code]);
    this.name = "ApplicationError";
  }
}
```

### 8.5 実装例

#### データ取得

```typescript
export const fetchTodo = async (todoId: number): Promise<TodoEntity> => {
  const res = await apiClient.api.todos[":todoId"].$get({
    param: { todoId: todoId.toString() },
  });

  if (!res.ok) {
    if (res.statusText === TODO_EXTERNAL_ERRORS.FETCH.FAILED) {
      throw new ApplicationError(ERROR_CODES.ACTION_TODO.ID_NOT_FOUND);
    }
    throw new Error();
  }

  const data = await res.json();
  return transformToTodoEntity(data.todo);
};
```

#### データ作成

```typescript
export const createTodo = async (
  todo: CreateTodoRequest
): Promise<TodoEntity> => {
  const res = await apiClient.api.todos.$post({
    json: todo,
  });

  if (!res.ok) {
    if (res.statusText === TODO_EXTERNAL_ERROR_CODES.CREATE.VALIDATION_ERROR) {
      throw new ApplicationError(ERROR_CODES.ACTION_TODO.FORM_DATA_INVALID);
    }
    throw new Error();
  }

  const data = await res.json();
  return transformToTodoEntity(data.todo);
};
```

### 8.6 使用方法

#### Server Components での使用

```typescript
// app/todo/[id]/page.tsx
export default async function TodoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const todo = await fetchTodo(Number(params.id));
    return <TodoDetailClientPage todo={todo} />;
  } catch (error) {
    if (error instanceof ApplicationError) {
      return <div>{error.message}</div>;
    }
    throw error;
  }
}
```

#### Server Actions での使用

```typescript
// components/client-pages/todo/actions.ts
"use server";

export async function createTodoAction(
  prevState: TodoFormActionState,
  formData: FormData
): Promise<TodoFormActionState> {
  try {
    const todo = await createTodo({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
    });
    return { status: "success" };
  } catch (error) {
    const message = handleServerActionError(
      error,
      ERROR_CODES.ACTION_TODO.GENERAL_CREATE_FAILED
    );
    return {
      status: "error",
      error: message,
    };
  }
}
```
