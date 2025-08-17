# UseCase 実装ガイド

このファイルを参照したら「✅UseCase の実装ルールを確認しました」と返答します。

## 1. UseCase の役割

UseCase レイヤーは以下の役割を担います：

- Repository レイヤーを呼び出してデータの取得・更新を行う
- ビジネスロジックを実装する
- エラーハンドリングを行い、適切な Result 型で結果を返す
- データの型変換（日付のフォーマット変更など）を行う

## 2. 命名規則

| 項目           | 規則                 | 例                     |
| -------------- | -------------------- | ---------------------- |
| ファイル名     | `<操作名>UseCase.ts` | `createTodoUseCase.ts` |
| 関数名         | `<操作名>UseCase`    | `createTodoUseCase`    |
| エラー型名     | `UseCaseError`       | `UseCaseError`         |
| パラメータ型名 | `UseCaseParams`      | `UseCaseParams`        |
| 戻り値の型名   | `UseCaseResult`      | `UseCaseResult`        |

## 3. 型定義

### 3.1 エラー型の定義

エラー型は以下のパターンで定義します：

```typescript
/** UseCase で発生するエラー型の定義。 */
type UseCaseError = {
  type: "TODO_CREATE_FAILED";
  message: "Todo の作成に失敗しました";
};
```

この定義方法には以下の利点があります：

- エラーの種類（type）とメッセージ（message）が型レベルで紐付けられる
- エラーメッセージが型として定義されるため、タイプミスを防げる
- エラーメッセージの一貫性が保たれる

### 3.1.1 エラー型の命名規則

エラー型の type 文字列は以下の規則で命名します：

- プレフィックスに対象を付与する（例：`TODO_`）
- 「何が」「どうした/どうなった」が明確になるように命名する
  - `TODO_CREATE_FAILED`: Todo の作成に失敗
  - `TODO_FETCH_FAILED`: Todo の取得に失敗
- 実装の詳細（レイヤーなど）は含めず、事象を表現する
  - 良い例：`TODO_CREATE_FAILED`
  - 悪い例：`TODO_REPOSITORY_ERROR`

### 3.2 パラメータ型の定義

```typescript
/** UseCase のパラメータ型の定義。 */
type UseCaseParams = {
  title: string;
  description: string;
  userId: number;
};
```

### 3.3 戻り値の型定義

戻り値の型は必ず `Result<T, Error>` を使用します：

```typescript
/** UseCase の戻り値型の定義。 */
type UseCaseResult = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  userId: number;
  createdAt: string; // ISO 8601形式の文字列
  updatedAt: string; // ISO 8601形式の文字列
};

Promise<Result<UseCaseResult, UseCaseError>>;
// または
Promise<Result<UseCaseResult[], UseCaseError>>;
```

## 4. エラーハンドリング

### 4.1 基本方針

- エラーは throw ではなく `Result` 型で返す
- エラーは discriminated union として定義する
- エラーメッセージは具体的に記述する
- エラーの種類は `type` として定義する
- エラーメッセージは日本語で記述する

### 4.2 エラーを返す実装例

```typescript
// Repository のエラーを UseCase のエラーに変換する。
if (repositoryResult.isErr()) {
  return err({
    type: "TODO_CREATE_FAILED",
    message: "Todo の作成に失敗しました",
  });
}
```

## 5. 実装パターン

### 5.1 作成系 UseCase

```typescript
import { err, ok, type Result } from "neverthrow";
import { createTodo } from "../../repository/mutation/todo/createTodo";

/** UseCase のパラメータ型の定義。 */
type UseCaseParams = {
  title: string;
  description: string;
  userId: number;
};

/** UseCase の戻り値型の定義。 */
type UseCaseResult = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

/** UseCase で発生するエラー型の定義。 */
type UseCaseError = {
  type: "TODO_CREATE_FAILED";
  message: "Todo の作成に失敗しました";
};

export const createTodoUseCase = async (
  params: UseCaseParams
): Promise<Result<UseCaseResult, UseCaseError>> => {
  // Repository を呼び出してデータを取得する。
  const repositoryResult = await createTodo(params);

  // Repository のエラーを UseCase のエラーに変換する。
  if (repositoryResult.isErr()) {
    return err({
      type: "TODO_CREATE_FAILED",
      message: "Todo の作成に失敗しました",
    });
  }

  //  データを UseCase の戻り値型に変換する。
  const useCaseResult = {
    id: repositoryResult.value.id,
    title: repositoryResult.value.title,
    completed: repositoryResult.value.completed,
    description: repositoryResult.value.description,
    userId: repositoryResult.value.userId,
    createdAt: repositoryResult.value.createdAt.toISOString(),
    updatedAt: repositoryResult.value.updatedAt.toISOString(),
  };

  return ok(useCaseResult);
};
```

### 5.2 取得系 UseCase

```typescript
import { err, ok, type Result } from "neverthrow";
import { getTodosByUserId } from "../../repository/query/todo/getTodosByUserId";

/** UseCase のパラメータ型の定義。 */
type UseCaseParams = {
  userId: number;
  search?: string;
};

/** UseCase の戻り値型の定義。 */
type UseCaseResult = {
  id: number;
  title: string;
  completed: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

/** UseCase で発生するエラー型の定義。 */
type UseCaseError = {
  type: "TODO_FETCH_FAILED";
  message: "Todo の取得に失敗しました";
};

export const fetchTodosUseCase = async (
  params: UseCaseParams
): Promise<Result<UseCaseResult[], UseCaseError>> => {
  // Repository を呼び出してデータを取得する。
  const repositoryResult = await getTodosByUserId(params);

  // Repository のエラーを UseCase のエラーに変換する。
  if (repositoryResult.isErr()) {
    return err({
      type: "TODO_FETCH_FAILED",
      message: "Todo の取得に失敗しました",
    });
  }

  //  データを UseCase の戻り値型に変換する。
  const useCaseResult = repositoryResult.value.map((todo) => ({
    id: todo.id,
    title: todo.title,
    completed: todo.completed,
    description: todo.description,
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  }));

  return ok(useCaseResult);
};
```

## 6. コメント規則

### 6.1 基本ルール

- エラークラスには JSDoc でエラーの説明を記述する
- UseCase 関数には JSDoc で処理の説明、パラメータ、戻り値の説明を記述する
- 処理の各ステップにはインラインコメントで説明を記述する
- インラインコメントは処理の前の行に記述する
- コメントは「。」で、または、半角英数字で終わる場合は「.」で終わる完全な文章で記述する
- コメントは「だ・である」調で統一する

### 6.2 インラインコメント

```typescript
// Repository を呼び出してデータを取得する。
const repositoryResult = await getTodosByUserId(params)

// Repository のエラーを UseCase のエラーに変換する。
if (repositoryResult.isErr()) {
  return err({...})
}

// データを UseCase の戻り値型に変換する。
const useCaseResult = repositoryResult.value.map((todo) => ({...}))
```

## 7. 実装チェックリスト

UseCase 実装時は以下の点を確認してください：

- [ ] 命名規則に従っているか
- [ ] エラー型が適切に定義されているか
- [ ] パラメータ型と戻り値型が適切に定義されているか
- [ ] Repository のエラーを適切に変換しているか
- [ ] データの型変換（日付のフォーマットなど）が適切に行われているか
- [ ] インラインコメントが適切に記述されているか
- [ ] コメントが「だ・である」調で統一されているか
- [ ] コメントが「。」で、または、半角英数字で終わる場合は「.」で終わる完全な文章になっているか
