import "zod-openapi/extend";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { createFactory } from "hono/factory";
import { match } from "ts-pattern";
import type { EnvironmentVariables } from "../../../env";
import { ENDPOINT_ERROR_CODES } from "../../errorCode";
import { AppHTTPException, getErrorResponseForOpenAPISpec } from "../../errorResponse";
import z from "zod";
import { deleteTodoUseCase } from "../../../use-case/todo/deleteTodoUseCase";

/**
 * Todo を削除する Handler.
 *
 * @returns void
 */
export const deleteTodoHandlers = createFactory<EnvironmentVariables>().createHandlers(
  describeRoute({
    description: "Todo を削除する",
    tags: ["todo"],
    responses: {
      200: {
        description: "Todo の削除に成功",
        content: {
          "application/json": {
            schema: resolver(z.void()),
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
    const todoId = c.req.param("todoId");

    // UseCase を呼び出す。
    const result = await deleteTodoUseCase({
      userId,
      todoId: Number(todoId),
    });

    // エラーが発生した場合は、エラーの種類を網羅的にマッチングし、
    // 対応するエラーコード AppHTTPException に設定してスローする。
    if (result.isErr()) {
      const error = result.error;
      match(error)
        .with({ type: "TODO_DELETE_FAILED" }, () => {
          throw new AppHTTPException(
            // TODO:修正する
            ENDPOINT_ERROR_CODES.GET_TODOS.FETCH_FAILED.code,
          );
        })
        .exhaustive();
      return c.json({ error: "not found" }, 500);
    }

    // レスポンスを生成する。
    return c.json(null);
  },
);
