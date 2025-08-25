import { execSync } from 'node:child_process'

const TEST_DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://testuser:testpass@localhost:54321/myapp_test'

export async function setup() {
  try {
    console.log('🔧 Global setup: Setting up test database...')
    console.log(`🔧 Using DATABASE_URL: ${TEST_DATABASE_URL}`)

    // 環境変数設定
    process.env.DATABASE_URL = TEST_DATABASE_URL

    // マイグレーション実行
    execSync('npx prisma migrate deploy', {
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: TEST_DATABASE_URL,
      },
    })

    console.log('✅ Global setup: Database migration complete')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  }
}

export async function teardown() {
  try {
    // 動的インポートでPrismaクライアントを取得してdisconnect
    const { disconnectPrisma } = await import('../prisma')
    await disconnectPrisma()
    console.log('🧹 Global teardown: Prisma disconnected')
  } catch (_) {
    // エラーが発生してもteardownは続行
    console.log('🧹 Global teardown complete (with warning)')
  }
}
