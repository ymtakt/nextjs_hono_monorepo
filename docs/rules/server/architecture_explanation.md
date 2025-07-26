# Hono + Prisma アーキテクチャの詳細解説（元設計ベース）

## 📁 フォルダ・ファイル構成と役割

### 🗂️ **プロジェクト全体の構造**

```
api/
├── prisma/           # データベース設定・スキーマ管理
├── generated/        # Prisma自動生成ファイル（gitignore対象）
├── sql/              # データベース操作スクリプト
├── src/              # アプリケーションコード
└── 設定ファイル群
```

---

## 🏗️ **レイヤードアーキテクチャの依存関係**

```
┌─────────────┐
│  endpoint/  │ ← プレゼンテーション層
└─────────────┘
       ↓
┌─────────────┐
│  use-case/  │ ← アプリケーション層
└─────────────┘
       ↓
┌─────────────┐
│ repository/ │ ← データアクセス層
└─────────────┘
       ↓
┌─────────────┐
│   Prisma    │ ← インフラ層
└─────────────┘
```

**依存関係のルール：**
- **上位層は下位層のみに依存**
- **下位層は上位層を知らない**
- **同じ層内では相互依存可能**

---

## 📂 **各ディレクトリの詳細**

### 1. **prisma/** - データベース設定層
```
prisma/
├── migrations/       # マイグレーションファイル
├── schema.prisma    # データベーススキーマ定義
└── seed.ts          # 初期データ投入スクリプト
```

**役割：**
- データベーススキーマの定義
- マイグレーション履歴の管理
- シードデータの管理

**依存：** なし（最下位層）

---

### 2. **generated/client/** - Prisma生成ファイル
```
generated/client/
├── runtime/         # Prismaランタイムファイル
├── index.d.ts       # 型定義
├── index.js         # メインクライアント
└── ...              # その他生成ファイル
```

**役割：**
- Prismaクライアントの実装
- 型安全なデータベースアクセス
- **自動生成のため編集禁止**

**依存：** prisma/schema.prisma

---

### 3. **sql/** - データベース操作スクリプト
```
sql/
├── reset-local.ts   # ローカルDB初期化
└── seed-local.ts    # ローカルデータ投入
```

**役割：**
- 開発環境用のデータベース操作
- テスト環境用のセットアップ

**依存：** generated/client

---

### 4. **src/endpoint/** - プレゼンテーション層
```
endpoint/
├── handler/         # リクエストハンドラー
├── middleware/      # ミドルウェア
├── errorCode.ts     # エラーコード定義
└── errorResponse.ts # エラーレスポンス形式
```

#### **handler/** - リクエスト処理
```
handler/
├── todo/
│   ├── createTodoHandler.test.ts  # 🧪 ユニットテスト
│   ├── createTodoHandler.ts       # Todo作成処理
│   ├── getTodosHandler.test.ts    # 🧪 ユニットテスト
│   └── getTodosHandler.ts         # Todo取得処理
├── getHealthCheckHandlers.test.ts # 🧪 ユニットテスト
└── getHealthCheckHandlers.ts      # ヘルスチェック
```

**役割：**
- HTTPリクエストの受信・解析
- バリデーション
- use-caseの呼び出し
- HTTPレスポンスの生成

**依存：** use-case/ ← **ここのみ**

#### **middleware/** - 横断的関心事
```
middleware/
├── globalErrorHandlerMiddleware.ts # グローバルエラーハンドリング
├── requestIdMiddleware.ts          # リクエストID生成
└── setUserAuthMiddleware.ts        # ユーザー認証設定
```

**役割：**
- 認証・認可
- ログ出力
- エラーハンドリング
- リクエストの前処理・後処理

**依存：** util/ (部分的)

---

### 5. **src/use-case/** - アプリケーション層
```
use-case/
└── todo/
    ├── createTodoUseCase.ts  # Todo作成ビジネスロジック
    └── fetchTodosUseCase.ts  # Todo取得ビジネスロジック
```

**役割：**
- **ビジネスロジックの実装**
- 複数のrepositoryの組み合わせ
- トランザクション管理
- ドメインルールの適用

**依存：** repository/ ← **ここのみ**

**例：**
```typescript
// createTodoUseCase.ts
export const createTodoUseCase = async (userId: string, todoData: CreateTodoInput) => {
  // 1. バリデーション
  validateTodoData(todoData)
  
  // 2. ビジネスルール適用
  if (await countUserTodos(userId) >= MAX_TODOS) {
    throw new BusinessError('Todo limit exceeded')
  }
  
  // 3. データ作成
  return await createTodo({ ...todoData, userId })
}
```

---

### 6. **src/repository/** - データアクセス層
```
repository/
├── mutation/        # データ変更操作
│   └── createTodo.ts    # Todo作成
└── query/           # データ取得操作
    └── getTodosByUserId.ts  # ユーザーのTodo一覧取得
```

**役割：**
- **Prismaクエリの抽象化**
- CQRS（Command Query Responsibility Segregation）パターン
- データアクセスの統一化

**依存：** generated/client (Prismaクライアント)

**例：**
```typescript
// mutation/createTodo.ts
export const createTodo = async (data: CreateTodoData) => {
  return await prisma.todo.create({
    data: {
      title: data.title,
      description: data.description,
      userId: data.userId
    }
  })
}

// query/getTodosByUserId.ts
export const getTodosByUserId = async (userId: string) => {
  return await prisma.todo.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })
}
```

---

### 7. **src/util/** - 共通ユーティリティ
```
util/
├── seed/            # シード関連
│   ├── data/
│   │   ├── todoData.ts      # Todoテストデータ
│   │   └── userIds.ts       # ユーザーIDデータ
│   ├── databaseForSeed.ts   # シード用DB接続
│   ├── resetAndSeed.ts      # リセット&シード実行
│   ├── seedAllData.ts       # 全データシード
│   ├── seedTodoData.ts      # Todoデータシード
│   └── seedUserData.ts      # ユーザーデータシード
├── test-util/       # 🧪 テストユーティリティ
│   ├── db/
│   │   ├── dropTables.ts    # 🧪 テーブル削除
│   │   └── setupDb.ts       # 🧪 テストDB初期化
│   ├── env.d.ts             # 🧪 環境変数型定義
│   ├── mockSetUserAuthMiddleware.ts # 🧪 認証モック
│   ├── testClient.ts        # 🧪 テスト用HTTPクライアント
│   └── zodValidationErrorResponse.ts # 🧪 バリデーションエラー
├── factory.ts       # ファクトリー関数
└── logger.ts        # ログ設定
```

**役割：**
- 全レイヤーで使用する共通機能
- テスト支援機能
- 外部ライブラリの初期化
- シードデータ管理

**依存：** generated/client, 外部ライブラリ

---

### 8. **src/設定ファイル** 
```
src/
├── .dev.vars.sample  # 開発環境変数サンプル
├── env.ts           # 環境変数型定義・バリデーション
├── index.ts         # アプリケーションエントリポイント
└── schema.ts        # データベーススキーマ型定義
```

**役割：**
- アプリケーション設定
- 環境変数管理
- 型定義の集約

---

## 🧪 **テストファイルの識別方法**

### **テストファイルのパターン：**
1. **`*.test.ts`** - ユニットテスト（Handlerレイヤーのみ）
2. **`test-util/`** - テスト支援ファイル

### **テストファイル一覧：**
```
🧪 endpoint/handler/**/*.test.ts      # ハンドラーユニットテスト
🧪 util/test-util/                   # テストユーティリティ
```

---

## 🔄 **実際のデータフロー例**

### **Todo作成の流れ：**
```
1. POST /api/todos (index.ts → routes)
         ↓
2. setUserAuthMiddleware で認証チェック (middleware/setUserAuthMiddleware.ts)
         ↓
3. createTodoHandler でリクエスト処理 (handler/todo/createTodoHandler.ts)
         ↓
4. createTodoUseCase でビジネスロジック実行 (use-case/todo/createTodoUseCase.ts)
         ↓
5. createTodo でデータベース操作 (repository/mutation/createTodo.ts)
         ↓
6. Prismaクライアント (generated/client)
         ↓
7. データベース
```

---

## 🎯 **設計の特徴**

### **1. シンプルなテスト戦略**
- **Handler層のみでユニットテスト**を実装
- テストピラミッドの概念より実用性を重視
- `test-util/`で充実したテスト支援機能

### **2. 実用的なアーキテクチャ**
- 必要最小限のテストで開発速度を重視
- レイヤー分離による保守性確保
- CQRSパターンでデータアクセス最適化

### **3. 開発体験の最適化**
- 豊富なシード機能
- 環境別設定の分離
- 型安全性の確保

この構成により、**開発効率**と**保守性**のバランスを取った実用的なアーキテクチャが実現されます。