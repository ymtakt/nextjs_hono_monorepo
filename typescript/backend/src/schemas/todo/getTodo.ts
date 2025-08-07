import z from 'zod'

/** レスポンスデータのスキーマ。 */
export const getTodoResponseSchema = z.object({
  todo: z.object({
    id: z.number(),
    title: z.string(),
    completed: z.boolean(),
    description: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
})

export const getTodosResponseSchema = z.object({
  todos: z.array(getTodoResponseSchema.shape.todo),
})

export type TodoResponse = z.infer<typeof getTodoResponseSchema>
export type TodosResponse = z.infer<typeof getTodosResponseSchema>
