import { describe, expect, it } from 'vitest'
import { prisma } from '../../../util/prisma'
import { mockSetUserAuthMiddleware } from '../../../util/test-util/mockSetUserAuthMiddleware'
import { client } from '../../../util/test-util/testClient'

describe('getTodoHandler - 正常系', () => {
  it('指定されたTodoを正常に取得できる', async () => {
    // ユーザー情報をセットする
    mockSetUserAuthMiddleware({ userId: 1 })

    // テスト用のTodoを作成
    await prisma.todo.create({
      data: {
        id: 123,
        title: 'Test Todo',
        description: 'Test Description',
        userId: 1,
        completed: false,
      },
    })

    const res = await client.api.todos[':todoId'].$get({
      param: { todoId: '123' },
    })

    if (res.status !== 200) throw new Error('Todo取得に失敗しました')

    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.todo).toEqual({
      id: 123,
      title: 'Test Todo',
      description: 'Test Description',
      completed: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })
})
