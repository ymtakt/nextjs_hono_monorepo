# API サービス実装ルール

## 概要

API サービスは、外部 API との通信を担当する層です。
Hono クライアントを使用して API リクエストを行い、Result 型でレスポンスを返します。

## 基本方針

1. Hono クライアントの設定
2. エラーハンドリング
3. レスポンス型の定義
4. 環境変数の管理

## ファイル構成

```
core/
└── service/
    ├── api.service.ts   # APIクライアント設定
    └── api.type.ts      # 型定義
```

## 実装ルール

### 1. API クライアント設定

```typescript
// core/service/api.service.ts
import { hc } from "@hono/client";
import type { ApiType } from "@backend/src/index";

// ✅ 環境変数からベースURLを取得
const baseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!baseUrl) {
  throw new Error("API_URLが設定されていません");
}

// ✅ Honoクライアントの初期化
export const apiService = hc<ApiType>(baseUrl, {
  headers: {
    "Content-Type": "application/json",
  },
});
```

### 2. エラーハンドリング

```typescript
// core/service/api.type.ts
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ✅ エラーハンドリング関数
export async function handleApiError(error: unknown): Promise<never> {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        throw new ApiError(400, "VALIDATION_ERROR", "バリデーションエラー");
      case 401:
        throw new ApiError(401, "UNAUTHORIZED", "認証エラー");
      case 404:
        throw new ApiError(404, "NOT_FOUND", "リソースが見つかりません");
      default:
        throw new ApiError(500, "INTERNAL_SERVER_ERROR", "サーバーエラー");
    }
  }
  throw new ApiError(500, "UNKNOWN_ERROR", "予期せぬエラーが発生しました");
}
```

### 3. レスポンス型の定義

```typescript
// core/service/api.type.ts
export type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
};

export type ErrorResponse = {
  code: string;
  message: string;
  details?: Record<string, string[]>;
};
```

### 4. インターセプター

```typescript
// core/service/api.service.ts
import { Hono } from "hono";
import { ApiError } from "./api.type";

// ✅ リクエストインターセプター
const requestInterceptor = (config: RequestInit) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
};

// ✅ レスポンスインターセプター
const responseInterceptor = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(response.status, error.code, error.message);
  }
  return response;
};

// ✅ インターセプターの適用
const app = new Hono();
app.use("*", async (c, next) => {
  try {
    c.req.raw = new Request(c.req.url, requestInterceptor(c.req.raw));
    const response = await next();
    return responseInterceptor(response);
  } catch (error) {
    return handleApiError(error);
  }
});
```

## チェックリスト

### API クライアント

- [ ] 環境変数が適切に設定されている
- [ ] Hono クライアントが正しく初期化されている
- [ ] 共通ヘッダーが設定されている
- [ ] 型定義が適切

### エラーハンドリング

- [ ] エラー型が適切に定義されている
- [ ] エラーコードが定義されている
- [ ] エラーメッセージが適切
- [ ] エラー変換が実装されている

### レスポンス処理

- [ ] レスポンス型が定義されている
- [ ] 正常系のレスポンス変換が実装されている
- [ ] エラー系のレスポンス変換が実装されている
- [ ] バリデーションエラーの処理が実装されている

### セキュリティ

- [ ] 認証トークンの管理が適切
- [ ] 機密情報の扱いが適切
- [ ] CORS 設定が適切
- [ ] CSRF トークンの処理が実装されている
