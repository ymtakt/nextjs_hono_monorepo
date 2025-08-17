# Repository 実装ガイド

このファイルを参照したら「✅Repository の実装ルールを確認しました」と返答します。

## 1. Repository の役割

Repository レイヤーはデータベースアクセスを担当し、以下の責務を持ちます：

- データベースからのデータ取得
- データベースへのデータ保存・更新・削除
- データベース操作のエラーハンドリング
- 取得結果を適切な形式に変換

## 2. ディレクトリ構成

Repository は用途に応じて以下のディレクトリに配置します：

- **取得系**: `src/repository/query/` ディレクトリ
- **更新系**: `src/repository/mutation/` ディレクトリ

## 3. 命名規則

| 操作         | 接頭辞       | 例                 |
| ------------ | ------------ | ------------------ |
| 取得（単一） | `get`        | `getTodoById`      |
| 取得（複数） | `getTodosBy` | `getTodosByUserId` |
| 作成         | `create`     | `createTodo`       |
| 更新         | `update`     | `updateTodo`       |
| 削除         | `delete`     | `deleteTodo`       |

## 4. 戻り値の型

- すべての Repository 関数は `Promise<Result<T, Error>>` 型を返す
- 成功時は `ok(データ)` を返す
- 失敗時は `err(エラー)` を返す

## 5. 実装パターン

### 5.1 取得系 Repository

```typescript
import { getContext } from "hono/context-storage";
import { err, ok, type Result } from "neverthrow";
import type { EnvironmentVariables } from "../../../env";

/** Todo を取得する際のパラメータ。 */
type RepositoryParams = {
  userId: number;
  search?: string;
};

/** Todo の取得結果。 */
type Todo = {
  id: number;
  title: string;
  completed: boolean;
  description: string | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

export const getTodosByUserId = async (
  params: RepositoryParams
): Promise<Result<Todo[], Error>> => {
  const c = getContext<EnvironmentVariables>();
  const logger = c.get("logger");
  const prisma = c.get("prisma");

  try {
    // ユーザーIDに紐づくTODO一覧を取得する。（作成日時の降順）
    const todos = await prisma.todo.findMany({
      where: { userId: params.userId, title: { contains: params.search } },
      orderBy: { createdAt: "desc" },
    });

    // ISO 8601 文字列を Date 型に変換して返す。
    const processedTodos = todos.map((todo) => ({
      ...todo,
      createdAt: new Date(todo.createdAt),
      updatedAt: new Date(todo.updatedAt),
    }));

    return ok(processedTodos);
  } catch (error) {
    // エラーログを出力する。
    logger.error(`Todo 一覧の取得に失敗しました: ${error}`);
    return err(new Error(`Todo 一覧の取得に失敗しました: ${params.userId}`));
  }
};
```

### 5.2 更新系 Repository

```typescript
import { getContext } from "hono/context-storage";
import { err, ok, type Result } from "neverthrow";
import type { EnvironmentVariables } from "../../../env";

/** Todo を作成する際のパラメータ。 */
type RepositoryParams = {
  title: string;
  description: string;
  userId: number;
};

/** Todo の作成結果。 */
type RepositoryResult = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 新しい Todo を作成する。
 * @param params - パラメータ。
 * @returns 作成された Todo の情報。
 */
export const createTodo = async (
  params: RepositoryParams
): Promise<Result<RepositoryResult, Error>> => {
  const c = getContext<EnvironmentVariables>();
  const logger = c.get("logger");
  const prisma = c.get("prisma");

  try {
    // Todo を作成する。
    const createdTodo = await prisma.todo.create({
      data: {
        title: params.title,
        description: params.description,
        userId: params.userId,
      },
    });

    // 作成に失敗した場合はエラーを返す。
    if (!createdTodo) {
      return err(new Error(`Todo の作成に失敗しました: ${params.title}`));
    }

    // 作成した Todo の情報を返す。
    const result: RepositoryResult = {
      id: createdTodo.id,
      title: createdTodo.title,
      description: createdTodo.description,
      completed: createdTodo.completed,
      userId: createdTodo.userId,
      createdAt: new Date(createdTodo.createdAt),
      updatedAt: new Date(createdTodo.updatedAt),
    };

    return ok(result);
  } catch (error) {
    // エラーログを出力する。
    logger.error(`Todo の作成に失敗しました: ${error}`);
    return err(new Error(`Todo の作成に失敗しました: ${params.title}`));
  }
};
```

## 6. エラーハンドリング

- すべてのデータベース操作は try-catch でエラーをキャッチする
- エラーは適切にログ出力する
- エラーは `Result` 型の `err` で返す
- 特定のエラー条件（存在しないレコードなど）は明示的にチェックする

## 7. コメント規則

### 7.1 基本ルール

- 関数には JSDoc でその目的、パラメータ、戻り値を記述する
- 型定義には必要に応じてコメントを付ける
- 処理の各ステップにはインラインコメントで説明を記述する
- コメントは「。」で、または、半角英数字で終わる場合は「.」で終わる完全な文章で記述する
- コメントは「だ・である」調で統一する
- インラインコメントは処理の前の行に記述する

### 7.2 JSDoc コメント

#### 関数の JSDoc

```typescript
/**
 * 新しい Todo を作成する。
 * @param params - パラメータ。
 * @returns 作成された Todo の情報。
 */
```

#### 型定義の JSDoc

```typescript
/** Todo を作成する際のパラメータ。 */
type RepositoryParams = {
  title: string;
  description: string;
  userId: number;
};
```

```typescript
/** Todo の作成結果。 */
type RepositoryResult = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};
```

### 7.3 インラインコメント

#### データベース操作の説明

```typescript
// Todo を作成する。
const createdTodo = await prisma.todo.create(...)
```

#### データ加工の説明

```typescript
// ISO 8601 文字列を Date 型に変換して返す。
const processedTodos = todos.map(...)
```

#### 条件分岐の説明

```typescript
// 作成に失敗した場合はエラーを返す。
if (!createdTodo) {
  return err(new Error(...))
}
```

## 8. 実装チェックリスト

Repository 実装時は以下の点を確認してください：

- [ ] 命名規則に従っているか
- [ ] 適切なディレクトリに配置されているか
- [ ] 戻り値の型が `Result<T, Error>` になっているか
- [ ] try-catch でエラーをキャッチしているか
- [ ] エラーログが適切に出力されているか
- [ ] 特定のエラー条件が明示的にチェックされているか
- [ ] JSDoc コメントが適切に記述されているか
- [ ] 各処理ステップにインラインコメントが記述されているか
- [ ] コメントが「だ・である」調で統一されているか
- [ ] コメントが「。」で、または、半角英数字で終わる場合は「.」で終わる完全な文章になっているか
- [ ] パラメータ型と戻り値型が関数の直前に定義されているか
- [ ] 型定義に JSDoc コメントが記述されているか
