import z from 'zod'

/** リクエストデータのスキーマ。 */
export const createTodoRequestSchema = z.object({
  title: z.string(),
  description: z.string(),
  completed: z.boolean(),
})

/** レスポンスデータのスキーマ。 */
export const createTodoResponseSchema = z.object({
  todo: z.object({
    id: z.number(),
    title: z.string(),
    completed: z.boolean(),
    description: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
})

export type CreateTodoResponse = z.infer<typeof createTodoResponseSchema>
export type CreateTodoRequest = z.infer<typeof createTodoRequestSchema>
