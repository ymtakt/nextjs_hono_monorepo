# ドメインロジック実装ルール

## 概要

ドメインロジックは、アプリケーションのビジネスロジックを担当する層です。
API サービスを使用してデータを取得・操作し、Result 型でエラーハンドリングを行います。

## 基本方針

1. React に依存しない純粋な関数
2. API サービスを使用したデータ操作
3. Result 型でのエラーハンドリング
4. テスタブルな設計

## ファイル構成

```
domain/
├── data/              # Entity定義
│   └── todo.data.ts
└── logic/
    ├── ssr/          # SSR用ロジック
    │   └── todo/
    │       ├── fetch-todo.ts
    │       └── fetch-todos.ts
    ├── action/       # Server Action用ロジック
    │   └── todo/
    │       ├── create-todo.ts
    │       ├── update-todo.ts
    │       └── delete-todo.ts
    └── util/         # 共通ロジック
        └── todo/
            └── transform-to-todo-entity.ts
```

## 実装ルール

### 1. Entity 定義

```typescript
// domain/data/todo.data.ts
export type TodoEntity = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};
```

### 2. SSR ロジック

```typescript
// domain/logic/ssr/todo/fetch-todos.ts
import { Result, ok, err } from "neverthrow";
import { apiService } from "@/core/service/api.service";
import { TodoEntity } from "@/domain/data/todo.data";
import { transformToTodoEntity } from "@/domain/logic/util/todo/transform-to-todo-entity";

export type FetchTodosError = {
  type: "FETCH_ERROR";
  message: string;
};

export async function fetchTodosLogic(): Promise<
  Result<TodoEntity[], FetchTodosError>
> {
  try {
    const response = await apiService.api.todo.$get();

    if (!response.ok) {
      return err({ type: "FETCH_ERROR", message: "取得に失敗しました" });
    }

    const data = await response.json();
    const todos = data.todos.map(transformToTodoEntity);

    return ok(todos);
  } catch (error) {
    return err({
      type: "FETCH_ERROR",
      message: "予期せぬエラーが発生しました",
    });
  }
}
```

### 3. Server Action ロジック

```typescript
// domain/logic/action/todo/create-todo.ts
import { Result, ok, err } from "neverthrow";
import { apiService } from "@/core/service/api.service";
import { TodoEntity, CreateTodoData } from "@/domain/data/todo.data";
import { transformToTodoEntity } from "@/domain/logic/util/todo/transform-to-todo-entity";

export type CreateTodoError = {
  type: "VALIDATION_ERROR" | "API_ERROR";
  message: string;
};

export async function createTodoLogic(
  data: CreateTodoData
): Promise<Result<TodoEntity, CreateTodoError>> {
  try {
    const response = await apiService.api.todo.$post({
      json: data,
    });

    if (!response.ok) {
      return err({
        type: "API_ERROR",
        message: "作成に失敗しました",
      });
    }

    const responseData = await response.json();
    const todo = transformToTodoEntity(responseData);

    return ok(todo);
  } catch (error) {
    return err({
      type: "API_ERROR",
      message: "予期せぬエラーが発生しました",
    });
  }
}
```

### 4. 変換ロジック

```typescript
// domain/logic/util/todo/transform-to-todo-entity.ts
import { TodoEntity } from "@/domain/data/todo.data";

type ApiTodoResponse = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export function transformToTodoEntity(data: ApiTodoResponse): TodoEntity {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    completed: data.completed,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}
```

## チェックリスト

### Entity 定義

- [ ] 必要なプロパティが定義されている
- [ ] 型の命名が適切
- [ ] 必要に応じて読み取り専用にしている
- [ ] バリデーションルールが定義されている

### SSR ロジック

- [ ] Result 型を使用している
- [ ] エラー型が定義されている
- [ ] API サービスを使用している
- [ ] 適切な変換ロジックを使用している

### Server Action ロジック

- [ ] Result 型を使用している
- [ ] エラー型が定義されている
- [ ] バリデーションを実装している
- [ ] API サービスを使用している

### 変換ロジック

- [ ] 型の変換が適切
- [ ] 日付の変換が適切
- [ ] null/undefined の処理が適切
- [ ] バリデーションを実装している
