import { serve } from '@hono/node-server'
import { Scalar } from '@scalar/hono-api-reference'
import { openAPISpecs } from 'hono-openapi'
import { getHealthCheckHandlers } from './endpoint/handler/getHealthCheckHandlers'
import { createTodoHandlers } from './endpoint/handler/todo/createTodoHandler'
import { deleteTodoHandlers } from './endpoint/handler/todo/deleteTodoHandler'
import { getTodoHandlers } from './endpoint/handler/todo/getTodoHandler'
import { getTodosHandlers } from './endpoint/handler/todo/getTodosHandler'
import { updateTodoHandlers } from './endpoint/handler/todo/updateTodoHandler'
import { createApp } from './util/factory'

const app = createApp()

const routes = app
  // アプリケーションの疎通確認用のハンドラ。
  .get('/', ...getHealthCheckHandlers)
  // ファビコンのリクエストに対しては 204 を返す。
  .get('/favicon.ico', () => new Response(null, { status: 204 }))

  // Todo 一覧を取得する。
  .get('/api/todos', ...getTodosHandlers)
  // Todo を取得する。
  .get('/api/todos/:todoId', ...getTodoHandlers)
  // Todo を作成する。
  .post('/api/todos', ...createTodoHandlers)
  // Todo を更新する。
  .put('/api/todos/:todoId', ...updateTodoHandlers)
  // Todo を削除する。
  .delete('/api/todos/:todoId', ...deleteTodoHandlers)

  .get(
    '/development/spec',
    openAPISpecs(app, {
      documentation: {
        info: {
          title: 'Hono API',
          version: '1.0.0',
          description: 'Server-side API for architecture-sample-app',
        },
        servers: [{ url: 'http://localhost:8080', description: 'Local Server' }],
        security: [{ bearerAuth: [] }],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'Firebase Auth IdToken を入力してください',
            },
          },
        },
      },
    }),
  )
  // 開発環境向け：API リファレンスを生成する。
  .get('/development/docs', Scalar({ theme: 'saturn', url: '/development/spec' }))

export type AppType = typeof routes

// テスト用にroutesもエクスポート
export { routes }

// テスト環境以外でのみサーバーを起動
if (process.env.NODE_ENV !== 'test') {
  const port = parseInt(process.env.PORT || '8080', 10)
  console.log(`Server is running on port ${port}`)

  // Node.js環境でのHonoサーバー起動
  serve({
    fetch: routes.fetch,
    port: port,
  })
}
