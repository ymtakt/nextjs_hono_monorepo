import 'zod-openapi/extend'
import { createFactory } from 'hono/factory'
import { describeRoute } from 'hono-openapi'
import { resolver, validator } from 'hono-openapi/zod'
import { match } from 'ts-pattern'
import type { EnvironmentVariables } from '../../../env'
import {
  updateTodoParamsSchema,
  updateTodoRequestBodySchema,
  updateTodoResponseSchema,
} from '../../../schemas'
import { updateTodoUseCase } from '../../../use-case/todo/updateTodoUseCase'
import { ENDPOINT_ERROR_CODES } from '../../errorCode'
import { AppHTTPException, getErrorResponseForOpenAPISpec } from '../../errorResponse'

const responseSchema = updateTodoResponseSchema.openapi({
  example: {
    todo: {
      id: 1,
      title: '買い物リスト作成',
      completed: false,
      description: '週末の買い物で必要なものをまとめる',
      createdAt: '2024-07-01T12:00:00.000Z',
      updatedAt: '2024-07-01T12:00:00.000Z',
    },
  },
})

/**
 * Todo を更新する Handler.
 *
 * @returns Todo を返却する。
 */
export const updateTodoHandlers = createFactory<EnvironmentVariables>().createHandlers(
  describeRoute({
    description: 'Todo を更新する',
    tags: ['todo'],
    responses: {
      200: {
        description: 'Todo の作成に成功',
        content: {
          'application/json': {
            schema: resolver(responseSchema),
          },
        },
      },
      400: getErrorResponseForOpenAPISpec(ENDPOINT_ERROR_CODES.GET_TODOS),
    },
  }),
  validator('param', updateTodoParamsSchema),
  validator('json', updateTodoRequestBodySchema),

  async (c) => {
    // 認証済みユーザー ID を取得する。
    const userId = c.get('userId')
    const todoId = c.req.param('todoId')

    // バリデーション済みのリクエストデータを取得する。
    const requestData = c.req.valid('json')

    // UseCase を呼び出す。
    const result = await updateTodoUseCase({
      todoId: Number(todoId),
      userId,
      title: requestData.title,
      description: requestData.description,
      completed: requestData.completed,
    })

    // エラーが発生した場合は、エラーの種類を網羅的にマッチングし、
    // 対応するエラーコード AppHTTPException に設定してスローする。
    if (result.isErr()) {
      const error = result.error
      match(error)
        .with({ type: 'TODO_UPDATE_FAILED' }, () => {
          throw new AppHTTPException(
            // TODO:修正する
            ENDPOINT_ERROR_CODES.GET_TODOS.FETCH_FAILED.code,
          )
        })
        .exhaustive()
      return c.json({ error: 'not found' }, 500)
    }

    // レスポンスデータを作成する。
    const responseData = {
      todo: result.value,
    }

    // レスポンスデータをバリデーションする。
    const validatedResponse = responseSchema.parse(responseData)

    // レスポンスを生成する。
    return c.json(validatedResponse)
  },
)
