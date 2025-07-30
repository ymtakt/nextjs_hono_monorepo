import { describe, expect, it } from 'vitest'
import { prisma } from '../../../util/prisma'
import { mockSetUserAuthMiddleware } from '../../../util/test-util/mockSetUserAuthMiddleware'
import { client } from '../../../util/test-util/testClient'

describe('正常系', () => {
  it('TODOリスト取得', async () => {
    // ユーザー情報をセットする。
    mockSetUserAuthMiddleware({ userId: 1 })

    await prisma.todo.create({
      data: {
        id: 1,
        title: 'Test Todo',
        description: 'Test Description',
        userId: 1,
      },
    })

    const res = await client.api.todos.$get()
    if (res.status !== 200) throw new Error('TODOリスト取得に失敗しました')
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.todos).toEqual([
      {
        id: 1,
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    ])
  })
})
