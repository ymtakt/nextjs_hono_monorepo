import { beforeAll } from 'vitest'
import { prisma } from '../prisma'

beforeAll(async () => {
  try {
    // プロセス環境変数でseedデータ作成済みかチェック
    if (!process.env.VITEST_SEED_CREATED) {
      console.log('🌱 Creating global seed data...')
      await createTestSeedData()
      process.env.VITEST_SEED_CREATED = 'true'
      console.log('✅ Seed data creation complete')
    } else {
      console.log('⏭️ Seed data already exists, skipping...')
    }
  } catch (error) {
    console.error('❌ Failed to create seed data:', error)
    throw error
  }
})

// seed データ作成関数
async function createTestSeedData() {
  try {
    const existingUser = await prisma.user.findUnique({ where: { id: 1 } })

    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: 1,
          email: 'test@example.com',
          password: 'password',
          name: 'Test User',
        },
      })
      console.log('📝 Created test user (id: 1)')
    } else {
      console.log('📝 Test user already exists (id: 1)')
    }
  } catch (error) {
    console.error('Failed to create seed data:', error)
    throw error
  }
}
