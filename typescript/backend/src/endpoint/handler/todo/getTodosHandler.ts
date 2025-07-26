import { z } from "zod";
import "zod-openapi/extend";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { createFactory } from "hono/factory";
import { match } from "ts-pattern";
import type { EnvironmentVariables } from "../../../env";
import { fetchTodosUseCase } from "../../../use-case/todo/fetchTodosUseCase";
import { ENDPOINT_ERROR_CODES } from "../../errorCode";
import {
  AppHTTPException,
  getErrorResponseForOpenAPISpec,
} from "../../errorResponse";

/** レスポンスデータのスキーマ。 */
const responseSchema = z
  .object({
    todos: z.array(
      z.object({
        id: z.number(),
        title: z.string(),
        completed: z.boolean(),
        description: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
    ),
  })
  .openapi({
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

export type TodosResponse = z.infer<typeof responseSchema>;

/**
 * Todo 一覧を取得する Handler.
 *
 * @returns Todo 一覧を返却する。
 */
export const getTodosHandlers =
  createFactory<EnvironmentVariables>().createHandlers(
    describeRoute({
      description: "Todo 一覧を取得する",
      tags: ["todos"],
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
      const result = await fetchTodosUseCase({
        userId,
      });

      // エラーが発生した場合は、エラーの種類を網羅的にマッチングし、
      // 対応するエラーコード AppHTTPException に設定してスローする。
      if (result.isErr()) {
        const error = result.error;
        match(error)
          .with({ type: "TODO_FETCH_FAILED" }, () => {
            throw new AppHTTPException(
              ENDPOINT_ERROR_CODES.GET_TODOS.FETCH_FAILED.code
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
