import { z } from "zod";
import "zod-openapi/extend";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { createFactory } from "hono/factory";
import { match } from "ts-pattern";
import type { EnvironmentVariables } from "../../../env";
import { ENDPOINT_ERROR_CODES } from "../../errorCode";
import { AppHTTPException, getErrorResponseForOpenAPISpec } from "../../errorResponse";
import { createTodoUseCase } from "../../../use-case/todo/createTodoUseCase";

/** リクエストデータのスキーマ。 */
const requestSchema = z.object({
  title: z.string(),
  description: z.string(),
});

/** レスポンスデータのスキーマ。 */
const responseSchema = z
  .object({
    todo: z.object({
      id: z.number(),
      title: z.string(),
      completed: z.boolean(),
      description: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  })
  .openapi({
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

export type CreateTodoResponse = z.infer<typeof responseSchema>;
export type CreateTodoRequest = z.infer<typeof requestSchema>;

/**
 * Todo を作成する Handler.
 *
 * @returns Todo を返却する。
 */
export const createTodoHandlers = createFactory<EnvironmentVariables>().createHandlers(
  describeRoute({
    description: "Todo を作成する",
    tags: ["todo"],
    responses: {
      200: {
        description: "Todo の作成に成功",
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

    // バリデーション済みのリクエストデータを取得する。
    const requestData = await c.req.json<CreateTodoRequest>();

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
          throw new AppHTTPException(ENDPOINT_ERROR_CODES.CREATE_TODO.FAILED.code);
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
  },
);
