import { execSync } from 'node:child_process'
import { afterAll, beforeAll, beforeEach } from 'vitest'
import { disconnectPrisma, prisma, resetTestData } from '../prisma'

// テスト用DB URL
const TEST_DATABASE_URL = 'postgresql://testuser:testpass@localhost:54321/myapp_test'

beforeAll(async () => {
  try {
    console.log('🔧 Setting up test database...')

    // テスト用DBに接続するための環境変数設定
    process.env.DATABASE_URL = TEST_DATABASE_URL

    // テスト用DBにマイグレーション実行
    execSync('npx prisma migrate deploy', {
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: TEST_DATABASE_URL,
      },
    })

    // 1. 一番最初はリセット
    console.log('🧹 Initial cleanup...')
    await resetTestData()

    // 2. seedデータを登録
    console.log('🔧 Creating test seed data...')
    await createTestSeedData()

    console.log('✅ Test database ready')
  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    console.error('Make sure test database is running: npm run test:db:up')
    throw error
  }
})

beforeEach(async () => {
  // 3. 各テストの実行前に適宜データが削除される
  try {
    // 全てのデータを削除
    // await resetTestData();

    // 特定のテーブルのデータを削除
    await prisma.todo.deleteMany()
  } catch (error) {
    console.error('Failed to clean test data:', error)
    throw error
  }
})

// 4. 各テストが回る（ここは自動）

afterAll(async () => {
  // 5. 全て終わったらリセット
  // 全てのデータを削除
  await resetTestData()
  // テスト終了後にクリーンアップ
  await disconnectPrisma()
})

// TODO:　別ファイルに移行する
// seed データ作成関数
async function createTestSeedData() {
  // テストユーザーを作成
  await prisma.user.create({
    data: {
      id: 1,
      email: 'test@example.com',
      password: 'password',
      name: 'Test User',
    },
  })
}
