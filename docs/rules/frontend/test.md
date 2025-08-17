# フロントエンドテスト方針

## 概要

フロントエンドのテストは、コンポーネントの責務に応じて適切なテスト手法を選択し、効率的かつ効果的なテストを実現します。
Vitest を使用し、各レイヤーに応じたテスト戦略を採用しています。

## テストの種類と目的

### 1. Domain Logic テスト

ビジネスロジックのテストを行います。外部依存を持たない純粋な関数として実装し、入出力の検証を行います。

```typescript
// __test__/domain/logic/action/todo/create-todo.test.ts
import { createTodoUseCase } from "@/domain/logic/action/todo/create-todo";
import { mockApiService } from "@/test/mocks/api-service";

describe("createTodoUseCase", () => {
  it("should create a todo successfully", async () => {
    const params = {
      title: "Test Todo",
      description: "Test Description",
    };

    const result = await createTodoUseCase(params);
    expect(result.isOk()).toBe(true);

    if (result.isOk()) {
      expect(result.value).toEqual({
        id: 1,
        title: params.title,
        description: params.description,
        isCompleted: false,
      });
    }
  });

  it("should return error when API fails", async () => {
    mockApiService.todos.create.mockRejectedValue(new Error());

    const result = await createTodoUseCase({
      title: "Test",
      description: "Test",
    });

    expect(result.isErr()).toBe(true);
  });
});
```

### 2. Server Action テスト

Server Actions のテストを行います。フォームデータの処理とエラーハンドリングを検証します。

```typescript
// __test__/component/client-page/todo/action.test.ts
import { createTodoAction } from "@/component/client-page/todo/action";
import { mockCreateTodoUseCase } from "@/test/mocks/use-case";

describe("createTodoAction", () => {
  it("should handle form submission successfully", async () => {
    const formData = new FormData();
    formData.append("title", "Test Todo");
    formData.append("description", "Test Description");

    const result = await createTodoAction({}, formData);
    expect(result.status).toBe("success");
  });

  it("should handle validation errors", async () => {
    const formData = new FormData();
    formData.append("title", ""); // Empty title

    const result = await createTodoAction({}, formData);
    expect(result.status).toBe("error");
    expect(result.validationErrors?.title).toBeDefined();
  });
});
```

### 3. Service テスト

API クライアントのテストを行います。外部 API との通信を検証します。

```typescript
// __test__/core/service/api.service.test.ts
import { apiService } from "@/core/service/api.service";
import { mockFetch } from "@/test/mocks/fetch";

describe("apiService", () => {
  it("should create todo successfully", async () => {
    const params = {
      title: "Test Todo",
      description: "Test Description",
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, ...params }),
    });

    const result = await apiService.todos.create(params);
    expect(result.id).toBe(1);
  });

  it("should handle API errors", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(
      apiService.todos.create({
        title: "Test",
        description: "Test",
      })
    ).rejects.toThrow();
  });
});
```

### 4. Util テスト

ユーティリティ関数のテストを行います。純粋な関数として実装し、入出力の検証を行います。

```typescript
// __test__/utils/date-format.test.ts
import { formatDate } from "@/utils/date-format";

describe("formatDate", () => {
  it("should format date correctly", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    expect(formatDate(date)).toBe("2024/01/01");
  });

  it("should handle invalid date", () => {
    expect(formatDate(new Date("invalid"))).toBe("-");
  });
});
```

## テスト実行環境

### 1. 実行コマンド

```bash
# 全テストの実行
bun run test

# 特定のテストファイルの実行
bun run test path/to/test.test.ts

# ウォッチモードでの実行
bun run test:watch
```

### 2. テストファイルの配置

```
src/
└── __test__/
    ├── component/
    │   └── client-page/
    │       └── todo/
    │           └── action.test.ts
    ├── core/
    │   └── service/
    │       └── api.service.test.ts
    ├── domain/
    │   └── logic/
    │       └── action/
    │           └── todo/
    │               └── create-todo.test.ts
    └── utils/
        └── date-format.test.ts
```

## テスト実装ルール

### 1. テストケースの命名

- テストケース名は「何をテストするか」を明確に
- 成功ケースと失敗ケースを必ず含める
- エッジケースも考慮する

```typescript
// ✅ 良い例
it("should create todo when all fields are valid", async () => {});
it("should return error when title is empty", async () => {});
it("should handle network errors gracefully", async () => {});

// ❌ 悪い例
it("test create", async () => {});
it("error case", async () => {});
```

### 2. モックの使用

- 外部依存はモックに置き換える
- モックは最小限に抑える
- テストの意図を明確にする

```typescript
// ✅ 良い例
mockApiService.todos.create.mockResolvedValue({
  id: 1,
  title: "Test",
  description: "Test",
});

// ❌ 悪い例
jest.mock("@/core/service/api.service", () => ({
  // 複雑すぎるモック
}));
```

### 3. アサーション

- 期待する結果を明確に
- 型の整合性も確認
- エラーケースも適切に検証

```typescript
// ✅ 良い例
expect(result.isOk()).toBe(true);
if (result.isOk()) {
  expect(result.value).toEqual({
    id: expect.any(Number),
    title: params.title,
  });
}

// ❌ 悪い例
expect(result).toBeTruthy();
```

## モック戦略の詳細

### 1. Hono RPC クライアントのモック

#### 基本的なモック設定

```typescript
// APIクライアント全体をモック化
vi.mock("@/core/service/api.service", () => ({
  apiClient: {
    api: {
      todos: {
        // GET /todos
        $get: vi.fn(),
        // POST /todos
        $post: vi.fn(),
        // 動的ルート用
        ":todoId": {
          // GET /todos/:todoId
          $get: vi.fn(),
          // PUT /todos/:todoId
          $put: vi.fn(),
          // DELETE /todos/:todoId
          $delete: vi.fn(),
        },
      },
    },
  },
}));
```

#### メソッド別のモック例

```typescript
// GETリクエスト（一覧取得）
vi.mocked(apiClient.api.todos.$get).mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({
    todos: [mockTodoData1, mockTodoData2],
  }),
});

// POSTリクエスト（作成）
vi.mocked(apiClient.api.todos.$post).mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({
    todo: mockCreatedTodoData,
  }),
});

// PUT リクエスト（更新）
vi.mocked(apiClient.api.todos[":todoId"].$put).mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({
    todo: mockUpdatedTodoData,
  }),
});

// DELETE リクエスト（削除）
vi.mocked(apiClient.api.todos[":todoId"].$delete).mockResolvedValue({
  ok: true,
});
```

### 2. モックデータの設計

#### API レスポンス形式のモックデータ

```typescript
// 基本的なTodoオブジェクト（API仕様に準拠）
const createMockTodoApiData = (overrides = {}) => ({
  id: 1,
  title: "テストTodo",
  description: "テストの説明",
  completed: false,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  ...overrides,
});

// 単一Todo取得用のレスポンス
const createMockTodoResponse = (todo = createMockTodoApiData()) => ({
  ok: true,
  json: vi.fn().mockResolvedValue({
    todo,
  }),
});

// 一覧取得用のレスポンス
const createMockTodosResponse = (todos = [createMockTodoApiData()]) => ({
  ok: true,
  json: vi.fn().mockResolvedValue({
    todos,
  }),
});

// 複数パターンのテストデータ
const mockTodoVariations = {
  completed: createMockTodoApiData({
    id: 1,
    title: "完了したTodo",
    completed: true,
  }),
  incomplete: createMockTodoApiData({
    id: 2,
    title: "未完了のTodo",
    completed: false,
  }),
  emptyDescription: createMockTodoApiData({
    id: 3,
    description: "",
  }),
  missingUpdatedAt: createMockTodoApiData({
    id: 4,
    updatedAt: "",
  }),
};
```

#### エラーレスポンスのモック

```typescript
// APIエラー（ok: false）
const createMockErrorResponse = (status = 400) => ({
  ok: false,
  status,
  statusText: "Bad Request",
});

// ネットワークエラー
const createMockNetworkError = () => {
  return Promise.reject(new Error("Network Error"));
};

// よくあるエラーパターン
const commonErrorResponses = {
  notFound: createMockErrorResponse(404),
  badRequest: createMockErrorResponse(400),
  serverError: createMockErrorResponse(500),
  networkError: createMockNetworkError(),
};
```

### 3. モックファクトリーの活用

```typescript
// テストヘルパー関数
const setupSuccessfulTodoFetch = (todoData = {}) => {
  const mockTodo = createMockTodoApiData(todoData);
  const mockResponse = createMockTodoResponse(mockTodo);

  vi.mocked(apiClient.api.todos[":todoId"].$get).mockResolvedValue(
    mockResponse
  );

  return mockTodo;
};

const setupFailedTodoFetch = (errorType = "notFound") => {
  const errorResponse = commonErrorResponses[errorType];
  vi.mocked(apiClient.api.todos[":todoId"].$get).mockResolvedValue(
    errorResponse
  );
};
```

### 4. 型安全なモック設定

```typescript
// 型安全なモックヘルパー
type MockApiResponse<T> = {
  ok: boolean;
  json: () => Promise<T>;
  status?: number;
  statusText?: string;
};

const createTypedMockResponse = <T>(
  data: T,
  options: { ok?: boolean; status?: number } = {}
): MockApiResponse<T> => ({
  ok: options.ok ?? true,
  status: options.status ?? 200,
  statusText: "OK",
  json: vi.fn().mockResolvedValue(data),
});

// 使用例
const mockResponse = createTypedMockResponse({
  todo: mockTodoVariations.completed,
});
```

### 5. モックの分離

```typescript
// ファイル毎にモックを分離
// __mocks__/api-client.ts
export const createMockApiClient = () => ({
  api: {
    todos: {
      $get: vi.fn(),
      $post: vi.fn(),
      ":todoId": {
        $get: vi.fn(),
        $put: vi.fn(),
        $delete: vi.fn(),
      },
    },
  },
});
```

## テストチェックリスト

### Domain Logic テスト

- [ ] 成功ケースのテストが実装されているか
- [ ] エラーケースのテストが実装されているか
- [ ] 外部依存がモックに置き換えられているか
- [ ] Result 型の検証が適切か

### Server Action テスト

- [ ] フォームデータの処理が検証されているか
- [ ] バリデーションエラーのテストが実装されているか
- [ ] 成功時のレスポンスが検証されているか
- [ ] エラー時のレスポンスが検証されているか

### Service テスト

- [ ] API 通信の成功ケースが検証されているか
- [ ] エラーレスポンスの処理が検証されているか
- [ ] ネットワークエラーの処理が検証されているか
- [ ] レスポンスの型が正しいか

### Util テスト

- [ ] 正常系のテストが実装されているか
- [ ] エッジケースのテストが実装されているか
- [ ] 入力値の境界値テストが実装されているか
- [ ] 戻り値の型が正しいか
