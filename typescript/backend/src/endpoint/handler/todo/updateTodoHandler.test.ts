import { afterEach, describe, expect, it } from 'vitest'
import { prisma } from '../../../util/prisma'
import { mockSetUserAuthMiddleware } from '../../../util/test-util/mockSetUserAuthMiddleware'
import { client } from '../../../util/test-util/testClient'

describe('updateTodoHandler - 正常系', () => {
  // 各テスト後にクリーンアップ
  afterEach(async () => {
    await prisma.todo.deleteMany()
  })

  it('指定されたTodoを正常に更新できる', async () => {
    // ユーザー情報をセットする
    mockSetUserAuthMiddleware({ userId: 1 })

    // テスト用のTodoを作成
    await prisma.todo.create({
      data: {
        id: 789,
        title: '更新前Todo',
        description: '更新前の説明',
        userId: 1,
        completed: false,
      },
    })

    const updateData = {
      title: '更新後Todo',
      description: '更新後の説明',
      completed: true,
    }

    const res = await client.api.todos[':todoId'].$put({
      param: { todoId: '789' },
      json: updateData,
    })

    if (res.status !== 200) throw new Error('Todo更新に失敗しました')

    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.todo).toEqual({
      id: 789,
      title: '更新後Todo',
      description: '更新後の説明',
      completed: true,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })

    // データベースでも正しく更新されているか確認
    const updatedTodo = await prisma.todo.findUnique({
      where: { id: 789 },
    })
    expect(updatedTodo?.title).toBe('更新後Todo')
    expect(updatedTodo?.description).toBe('更新後の説明')
    expect(updatedTodo?.completed).toBe(true)
  })
})
