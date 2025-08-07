import z from 'zod'

/** リクエストデータのスキーマ。 */
export const updateTodoRequestBodySchema = z.object({
  title: z.string(),
  description: z.string(),
  completed: z.boolean(),
})

/** パラメータスキーマ。 */
export const updateTodoParamsSchema = z.object({
  todoId: z.string(),
})

/** レスポンスデータのスキーマ。 */
export const updateTodoResponseSchema = z.object({
  todo: z.object({
    id: z.number(),
    title: z.string(),
    completed: z.boolean(),
    description: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
})

export type UpdateTodoResponse = z.infer<typeof updateTodoResponseSchema>
export type UpdateTodoRequest = z.infer<typeof updateTodoRequestBodySchema>
