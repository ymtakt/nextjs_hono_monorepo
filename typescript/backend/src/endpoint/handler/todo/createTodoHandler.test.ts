import { describe, expect, it } from 'vitest'
import { prisma } from '../../../util/prisma'
import { mockSetUserAuthMiddleware } from '../../../util/test-util/mockSetUserAuthMiddleware'
import { client } from '../../../util/test-util/testClient'

describe('createTodoHandler - 正常系', () => {
  it('新しいTodoを正常に作成できる', async () => {
    // ユーザー情報をセットする
    mockSetUserAuthMiddleware({ userId: 1 })

    const requestData = {
      title: '新しいTodo',
      description: '新しいTodoの説明',
    }

    const res = await client.api.todos.$post({
      json: requestData,
    })

    if (res.status !== 200) throw new Error('Todo作成に失敗しました')

    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.todo).toEqual({
      id: expect.any(Number),
      title: '新しいTodo',
      description: '新しいTodoの説明',
      completed: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })

    // データベースにも正しく保存されているか確認
    const savedTodo = await prisma.todo.findUnique({
      where: { id: data.todo.id },
    })
    expect(savedTodo).not.toBeNull()
    expect(savedTodo?.title).toBe('新しいTodo')
    expect(savedTodo?.userId).toBe(1)
  })
})
