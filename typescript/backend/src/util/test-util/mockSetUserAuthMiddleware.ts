import type { Context, Next } from 'hono'
import { vi } from 'vitest'
import { ERROR_CODES } from '../../endpoint/errorCode'
import { AppHTTPException } from '../../endpoint/errorResponse'

// モジュールレベルでモックを初期化する（一度だけ実行される）。
const { mockSetUserAuthMiddleware: mockModule } = (() => {
  // ユーザー認証ミドルウェアのモックを vi.hoisted で定義する。
  const mockSetUserAuthMiddleware = vi.hoisted(() => {
    const mock = vi.fn(async (_: Context, _next: Next): Promise<void> => {
      // モックの実装を上書きしないと利用できないようにしておく。
      throw new Error('Unimplemented')
    })
    return { setUserAuthMiddleware: mock }
  })

  vi.mock('../../endpoint/middleware/setUserAuthMiddleware', () => mockSetUserAuthMiddleware)

  return { mockSetUserAuthMiddleware }
})()

/** ユーザー認証ミドルウェアのモックの設定。 */
type MockConfig = {
  /** ユーザー ID. */
  userId?: number

  /** ID トークンの取得を失敗させるかどうか. */
  shouldFailIdToken?: boolean
}

/**
 * ユーザー認証ミドルウェアのモックを設定する。
 * @param config - モックの設定。
 * @param config.userId - ユーザー ID.
 */
export const mockSetUserAuthMiddleware = ({ userId }: MockConfig = {}) => {
  // モックの実装をリセットする（モジュール自体はリセットしない）。
  mockModule.setUserAuthMiddleware.mockReset()

  mockModule.setUserAuthMiddleware.mockImplementation(async (c: Context, next: Next) => {
    const logger = c.get('logger')

    // ユーザー ID が与えられていない場合は認証エラーをスローする。
    if (!userId) {
      if (logger) {
        logger.error('userId is not provided')
      }
      // エラーをスローする。
      throw new AppHTTPException(ERROR_CODES.AUTH.USER_AUTH_ERROR.code)
    }

    // ユーザー ID を Context にセットする。
    c.set('userId', userId)
    await next()
  })
}
