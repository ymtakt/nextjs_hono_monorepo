import type { MiddlewareHandler } from "hono";
import { ERROR_CODES } from "../errorCode";
import { AppHTTPException } from "../errorResponse";

/**
 * ユーザー認証を行い、Context にユーザー ID をセットするミドルウェア。
 * @param c コンテキスト。
 * @param next 次のミドルウェア。
 * @returns Promise<void>。
 */
export const setUserAuthMiddleware: MiddlewareHandler = async (c, next) => {
  const logger = c.get("logger");
  const prisma = c.get("prisma");

  try {
    // Authorization ヘッダーからトークンを取得
    // const authHeader = c.req.header("Authorization");
    // if (!authHeader?.startsWith("Bearer ")) {
    //   // TODO:修正する
    //   throw new AppHTTPException(ERROR_CODES.AUTH.USER_AUTH_ERROR.code);
    // }

    // const token = authHeader.replace("Bearer ", "");

    // TODO:一旦そのままidをセットする
    // JWTを検証（またはセッションテーブルをチェック）
    // const payload = await verifyJWT(token, c.env.JWT_SECRET);

    // // DBでユーザーの存在・有効性をチェック
    // const user = await prisma.user.findUnique({
    //   where: {
    //     id: payload.userId,
    //   },
    // });

    // if (!user) {
    //   throw new AppHTTPException(ERROR_CODES.AUTH.USER_AUTH_ERROR.code);
    // }

    // c.set("userId", user.id);

    c.set("userId", 1);

    await next();
  } catch (e) {
    logger.error("failed to verify user auth", e);
    // ユーザー認証に失敗した場合は、AppHTTPException をスローする。
    throw new AppHTTPException(ERROR_CODES.AUTH.USER_AUTH_ERROR.code);
  }
};
