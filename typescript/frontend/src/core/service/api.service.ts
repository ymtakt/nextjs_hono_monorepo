/**
 * core/services/
 *  - Service層
 *
 *  -  apiクライアントをカスタマイズする
 *  -  s3のsdk使うとか
 *  -  firebaseのsdk使うとか
 *  - honoのapiクライアントをそのまま使ってくらい（今の状態であれば）いらない
 *
 * 前提：
 *  - アプリに関する知識（アプリの言葉は出てこない）
 *  - APIの共通設定を行う
 *
 * @example
 *  ```typescript
 *  export const myApiClient = apiClient;
 *  ```
 */

import type { AppType } from 'backend/src'
import { hc } from 'hono/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const apiClient = hc<AppType>(API_URL)
