# 外界サービス実装ルール

## 概要

core/service は、外界との通信を担当する層です。
例：外部 API、データベース、ファイルシステム、S3、Firebase、Redis などとの通信を行い、エラーを適切にスローします。

## 基本方針

1. 外界との通信インターフェース
2. エラーハンドリング（例外スロー）
3. レスポンス型の定義
4. 環境変数の管理

## ファイル構成

```
core/
└── service/
    ├── api/
    │   ├── hono.service.ts     # Hono API クライアント
    ├── storage/
    │   ├── s3.service.ts       # AWS S3
    ├── firebase/
    │   ├── firestore.service.ts    # Firestore
```

## 実装ルール

### 1. 外部 API 通信

```typescript
// core/service/api/hono.service.ts
import { hc } from "@hono/client";
import type { ApiType } from "@backend/src/index";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;
if (!baseUrl) {
  throw new Error("API_URLが設定されていません");
}

// ✅ クライアント設定のみ
export const honoClient = hc<ApiType>(baseUrl, {
  headers: {
    "Content-Type": "application/json",
  },
});
```

### 3. ストレージ通信

```typescript
// core/service/storage/s3.service.ts
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

// ✅ S3の詳細は知らず、失敗したらエラー
export async function downloadFile(key: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);
    // ... バッファ変換処理

    return buffer;
  } catch (error) {
    // S3固有のエラーは関係なく、一律エラー
    throw new Error("ファイル取得に失敗しました");
  }
}
```

### 4. Firebase 通信

```typescript
// core/service/firebase/firestore.service.ts
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const app = initializeApp({
  // Firebase設定
});
const db = getFirestore(app);

// ✅ Firestoreの詳細は知らず、問題があればエラー
export async function fetchUsers(): Promise<UserData[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users: UserData[] = [];

    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as UserData);
    });

    return users;
  } catch (error) {
    // Firebase固有のエラーは隠蔽し、一律でエラー
    throw new Error("ユーザー取得に失敗しました");
  }
}
```

## チェックリスト

### 外界通信

- [ ] 環境変数が適切に設定されている
- [ ] クライアントが正しく初期化されている
- [ ] 共通設定が適用されている
- [ ] 型定義が適切

### エラーハンドリング

- [ ] 外界固有のエラーを隠蔽している
- [ ] 一律でエラーをスローしている
- [ ] エラーメッセージが適切
- [ ] 例外処理が実装されている

### レスポンス処理

- [ ] 生データの型が定義されている
- [ ] 正常系のデータ変換が実装されている
- [ ] 異常系の処理が実装されている
- [ ] バリデーションが必要に応じて実装されている

### セキュリティ

- [ ] 認証情報の管理が適切
- [ ] 機密情報の扱いが適切
- [ ] 接続設定が適切
- [ ] タイムアウト設定が実装されている
