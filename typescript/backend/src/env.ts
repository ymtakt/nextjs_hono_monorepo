import type { PrismaClient } from '../generated/client'
import type { AppLogger } from './util/logger'

/**
 * 環境変数の型定義。
 */
export type EnvironmentVariables = {
  Bindings: {
    // DB: D1Database
    // FIREBASE_PROJECT_ID: string
  }
  Variables: {
    // db: DrizzleD1Database
    logger: AppLogger
    userId: number
    prisma: PrismaClient
  }
}
