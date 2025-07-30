// tests/utils/testClient.ts または適切な場所
import { testClient } from 'hono/testing'
import { routes } from '../..'

export const client = testClient(routes)
