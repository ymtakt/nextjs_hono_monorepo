// util/test-util/testClient.ts
import { testClient } from "hono/testing";
import routes from "../..";

/**
 * テスト用の API クライアントを取得する。
 * @returns テスト用の API クライアント
 */
export const getTestClient = async () => testClient(routes);
