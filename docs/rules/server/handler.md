# Handler 実装ガイド

このファイルを参照したら「✅Handler の実装ルールを確認しました」と返答します。

## 1. Handler の役割

Handler は API エンドポイントのリクエスト処理とレスポンス生成を担当します。主な責務は以下の通りです：

- OpenAPI ドキュメントの生成
- リクエストの受け取り
- リクエストパラメータの取得
- UseCase の呼び出し
- レスポンスの生成
- エラーハンドリング

Handler は `src/endpoint/handler` ディレクトリに実装します。

## 2. Handler の基本構成

Handler は以下の基本構成で実装します：

```typescript
import "zod-openapi/extend";
import { createFactory } from "hono/factory";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import { match } from "ts-pattern";
import type { EnvironmentVariables } from "../../../env";
import {
  createTodoRequestSchema,
  createTodoResponseSchema,
} from "../../../schemas";
import { createTodoUseCase } from "../../../use-case/todo/createTodoUseCase";
import { ENDPOINT_ERROR_CODES } from "../../errorCode";
import {
  AppHTTPException,
  getErrorResponseForOpenAPISpec,
} from "../../errorResponse";

/**
 * openapi拡張を適用したレスポンスデータのスキーマ。
 */
const responseSchema = createTodoResponseSchema.openapi({
  example: {
    todo: {
      id: 1,
      title: "買い物リスト作成",
      completed: false,
      description: "週末の買い物で必要なものをまとめる",
      createdAt: "2024-07-01T12:00:00.000Z",
      updatedAt: "2024-07-01T12:00:00.000Z",
    },
  },
});

/**
 * Todo を作成する Handler.
 *
 * @returns Todo を返却する。
 */
export const createTodoHandlers =
  createFactory<EnvironmentVariables>().createHandlers(
    describeRoute({
      description: "Todo を作成する",
      tags: ["todo"],
      responses: {
        200: {
          description: "Todo の作成に成功",
          content: {
            "application/json": {
              schema: resolver(createTodoResponseSchema),
            },
          },
        },
        400: getErrorResponseForOpenAPISpec(ENDPOINT_ERROR_CODES.GET_TODOS),
      },
    }),
    validator("json", createTodoRequestSchema),

    async (c) => {
      // 認証済みユーザー ID を取得する。
      const userId = c.get("userId");

      // バリデーション済みのリクエストデータを取得する。
      const requestData = c.req.valid("json");

      // UseCase を呼び出す。
      const result = await createTodoUseCase({
        userId,
        title: requestData.title,
        description: requestData.description,
      });

      // エラーが発生した場合は、エラーの種類を網羅的にマッチングし、
      // 対応するエラーコード AppHTTPException に設定してスローする。
      if (result.isErr()) {
        const error = result.error;
        match(error)
          .with({ type: "TODO_CREATE_FAILED" }, () => {
            throw new AppHTTPException(
              ENDPOINT_ERROR_CODES.CREATE_TODO.FAILED.code
            );
          })
          .exhaustive();
        return c.json({ error: "not found" }, 500);
      }

      // レスポンスデータを作成する。
      const responseData = {
        todo: result.value,
      };

      // レスポンスデータをバリデーションする。
      const validatedResponse = responseSchema.parse(responseData);

      // レスポンスを生成する。
      return c.json(validatedResponse);
    }
  );
```

## 3. Handler の実装パターン

### 3.1 取得系の Handler

取得系の Handler は以下のパターンで実装します：

```typescript
import "zod-openapi/extend";
import { createFactory } from "hono/factory";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { match } from "ts-pattern";
import type { EnvironmentVariables } from "../../../env";
import { getTodosResponseSchema } from "../../../schemas";
import { getTodosUseCase } from "../../../use-case/todo/getTodosUseCase";
import { ENDPOINT_ERROR_CODES } from "../../errorCode";
import {
  AppHTTPException,
  getErrorResponseForOpenAPISpec,
} from "../../errorResponse";

/**
 * openapi拡張を適用したレスポンスデータのスキーマ。
 */
const responseSchema = getTodosResponseSchema.openapi({
  example: {
    todos: [
      {
        id: 1,
        title: "買い物リスト作成",
        completed: false,
        description: "週末の買い物で必要なものをまとめる",
        createdAt: "2024-07-01T12:00:00.000Z",
        updatedAt: "2024-07-01T12:00:00.000Z",
      },
    ],
  },
});

/**
 * Todo 一覧を取得する Handler.
 *
 * @returns Todo 一覧を返却する。
 */
export const getTodosHandlers =
  createFactory<EnvironmentVariables>().createHandlers(
    describeRoute({
      description: "Todo 一覧を取得する",
      tags: ["todo"],
      responses: {
        200: {
          description: "Todo 一覧の取得に成功",
          content: {
            "application/json": {
              schema: resolver(responseSchema),
            },
          },
        },
        400: getErrorResponseForOpenAPISpec(ENDPOINT_ERROR_CODES.GET_TODOS),
      },
    }),

    async (c) => {
      // 認証済みユーザー ID を取得する。
      const userId = c.get("userId");

      // UseCase を呼び出す。
      const result = await getTodosUseCase({ userId });

      // エラーが発生した場合は、エラーの種類を網羅的にマッチングし、
      // 対応するエラーコード AppHTTPException に設定してスローする。
      if (result.isErr()) {
        const error = result.error;
        match(error)
          .with({ type: "TODO_FETCH_FAILED" }, () => {
            throw new AppHTTPException(
              ENDPOINT_ERROR_CODES.GET_TODOS.FAILED.code
            );
          })
          .exhaustive();
        return c.json({ error: "not found" }, 500);
      }

      // レスポンスデータを作成する。
      const responseData = {
        todos: result.value,
      };

      // レスポンスデータをバリデーションする。
      const validatedResponse = responseSchema.parse(responseData);

      // レスポンスを生成する。
      return c.json(validatedResponse);
    }
  );
```

## 4. エラーハンドリング

Handler でのエラーハンドリングは `ts-pattern` の `match` を使用して、以下のパターンで実装します：

```typescript
// エラーが発生した場合は、エラーの種類を網羅的にマッチングし、
// 対応するエラーコード AppHTTPException に設定してスローする。
if (result.isErr()) {
  const error = result.error;
  match(error)
    .with({ type: "TODO_CREATE_FAILED" }, () => {
      throw new AppHTTPException(ENDPOINT_ERROR_CODES.CREATE_TODO.FAILED.code);
    })
    .exhaustive();
  return c.json({ error: "not found" }, 500);
}
```

### 4.1 エラーハンドリングの特徴

- `ts-pattern` の `match` を使用して、UseCase から返却されるエラーを網羅的にハンドリングする
- `.exhaustive()` を使用することで、すべてのエラーケースを網羅していることを型レベルで保証する
- UseCase のエラー型と HTTP エラーコードの対応関係を視覚的に分かりやすく表現する
- エラーハンドリングのロジックを集約し、保守性を高める

### 4.2 エラーレスポンス

エラーレスポンスは、ミドルウェアによって自動的に以下の形式で生成されます：

```typescript
{
  error: {
    code: string; // ERROR_CODES から適切なコードを使用する。
  }
}
```

## 5. Handler のテスト実装

### 5.1 テストの基本方針

Handler のテストは以下の方針で実装します：

- **UseCase はモックしない**: 実際のビジネスロジックを通してテストする
- **DB の状態も検証**: テスト後にデータベースの状態を確認して、期待通りのデータが保存されているかを検証する
- **エンドツーエンドテスト**: リクエストからレスポンスまでの一連の流れをテストする

### 5.2 基本的なテスト構成

```typescript
import { describe, expect, it } from "vitest";
import { prisma } from "../../../util/prisma";
import { mockSetUserAuthMiddleware } from "../../../util/test-util/mockSetUserAuthMiddleware";
import { client } from "../../../util/test-util/testClient";

describe("createTodoHandler - 正常系", () => {
  it("新しいTodoを正常に作成できる", async () => {
    // ユーザー情報をセットする
    mockSetUserAuthMiddleware({ userId: 1 });

    const requestData = {
      title: "新しいTodo",
      description: "新しいTodoの説明",
      completed: false,
    };

    const res = await client.api.todos.$post({
      json: requestData,
    });

    if (res.status !== 200) throw new Error("Todo作成に失敗しました");

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.todo).toEqual({
      id: expect.any(Number),
      title: "新しいTodo",
      description: "新しいTodoの説明",
      completed: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    // データベースにも正しく保存されているか確認
    const savedTodo = await prisma.todo.findUnique({
      where: { id: data.todo.id },
    });
    expect(savedTodo).not.toBeNull();
    expect(savedTodo?.title).toBe("新しいTodo");
    expect(savedTodo?.userId).toBe(1);
  });
});
```

## 6. コメント規則

### 6.1 基本ルール

- 各 Handler の実装には JSDoc コメントを記述する
- 各処理ブロックにはインラインコメントで説明を記述する
- コメントは「。」で、または、半角英数字で終わる場合は「.」で終わる完全な文章で記述する
- コメントは「だ・である」調で統一する

### 6.2 JSDoc コメント

Handler の実装には JSDoc コメントを記述します：

```typescript
/**
 * Todo を作成する Handler.
 *
 * @returns Todo を返却する。
 */
```

### 6.3 処理ブロックのコメント

Handler の実装内の各処理ブロックには、その処理が何をするのかを説明するコメントを記述します：

```typescript
// 認証済みユーザー ID を取得する。
const userId = c.get('userId')

// バリデーション済みのリクエストデータを取得する。
const requestData = c.req.valid('json')

// UseCase を呼び出す。
const result = await createTodoUseCase({...})

// エラーハンドリングを行う。
if (result.isErr()) {}
```

## 7. Handler 実装チェックリスト

Handler の実装時は以下の点を確認してください：

- [ ] リクエストスキーマが適切に定義されているか（必要な場合）
- [ ] レスポンススキーマが適切に定義されているか
- [ ] OpenAPI ドキュメントの設定が適切か
- [ ] リクエストパラメータの取得が実装されているか
- [ ] リクエストボディの検証が実装されているか（必要な場合）
- [ ] UseCase の呼び出しが実装されているか
- [ ] エラーハンドリングが実装されているか
  - [ ] `ts-pattern` の `match` を使用しているか
  - [ ] すべてのエラーケースを網羅しているか
  - [ ] `.exhaustive()` で型レベルの保証を行っているか
  - [ ] 適切なエラーコードとマッピングされているか
- [ ] レスポンスデータのバリデーションが実装されているか
- [ ] レスポンスの生成が実装されているか
- [ ] JSDoc コメントが記述されているか
- [ ] 各処理ブロックにコメントが記述されているか
- [ ] コメントが「だ・である」調で統一されているか
- [ ] コメントが「。」で、または、半角英数字で終わる場合は「.」で終わる完全な文章になっているか

## 8. Handler テスト実装チェックリスト

Handler のテスト実装時は以下の点を確認してください：

- [ ] UseCase はモックしていないか
- [ ] 正常系のテストケースが実装されているか
- [ ] 異常系のテストケースが実装されているか
- [ ] ステータスコードが適切に検証されているか
- [ ] レスポンスデータが適切に検証されているか
- [ ] データベースの状態が検証されているか
- [ ] エラーレスポンスの形式が検証されているか
- [ ] テストケースごとに適切なテストデータを使用しているか
