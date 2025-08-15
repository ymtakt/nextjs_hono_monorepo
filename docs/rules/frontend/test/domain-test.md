# Domain 層のモック戦略

## 基本方針

Domain 層では外部依存を適切にモック化し、ビジネスロジックに集中したテストを実施する。特に Hono RPC クライアントとレスポンスデータのモック化が重要。

## 1. Hono RPC クライアントのモック

### 基本的なモック設定

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

### メソッド別のモック例

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

## 2. モックデータの設計

### API レスポンス形式のモックデータ

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

### エラーレスポンスのモック

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

## 3. テストケース別のモック設定

### 正常系テストのモック

```typescript
describe("fetchTodo - 正常系", () => {
  beforeEach(() => {
    const mockResponse = createMockTodoResponse({
      id: 1,
      title: "取得テストTodo",
      completed: true,
    });

    vi.mocked(apiClient.api.todos[":todoId"].$get).mockResolvedValue(
      mockResponse
    );
  });

  it("正常にTodoを取得できる", async () => {
    const result = await fetchTodo(1);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.title).toBe("取得テストTodo");
      expect(result.value.isCompleted).toBe(true);
    }
  });
});
```

### 異常系テストのモック

```typescript
describe("fetchTodo - 異常系", () => {
  it("APIエラーの場合", async () => {
    vi.mocked(apiClient.api.todos[":todoId"].$get).mockResolvedValue(
      commonErrorResponses.notFound
    );

    const result = await fetchTodo(999);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toEqual({ type: "TODO_FETCH_FAILED" });
    }
  });

  it("ネットワークエラーの場合", async () => {
    vi.mocked(apiClient.api.todos[":todoId"].$get).mockRejectedValue(
      new Error("Network Error")
    );

    const result = await fetchTodo(1);

    expect(result.isErr()).toBe(true);
  });
});
```

## 4. パラメータ検証のテスト

### リクエストパラメータの確認

```typescript
it("正しいパラメータでAPIが呼ばれる", async () => {
  const mockResponse = createMockTodoResponse();
  vi.mocked(apiClient.api.todos[":todoId"].$get).mockResolvedValue(
    mockResponse
  );

  await fetchTodo(123);

  // パラメータの検証
  expect(apiClient.api.todos[":todoId"].$get).toHaveBeenCalledWith({
    param: { todoId: "123" }, // 数値→文字列変換の確認
  });
});
```

### リクエストボディの確認

```typescript
it("正しいJSONボディでAPIが呼ばれる", async () => {
  const createRequest = {
    title: "新しいTodo",
    description: "説明",
    completed: false,
  };

  const mockResponse = createMockTodoResponse();
  vi.mocked(apiClient.api.todos.$post).mockResolvedValue(mockResponse);

  await createTodo(createRequest);

  // リクエストボディの検証
  expect(apiClient.api.todos.$post).toHaveBeenCalledWith({
    json: createRequest,
  });
});
```

### 検索クエリパラメータの確認

```typescript
it("検索パラメータが正しく渡される", async () => {
  const mockResponse = createMockTodosResponse([]);
  vi.mocked(apiClient.api.todos.$get).mockResolvedValue(mockResponse);

  await fetchTodos("検索キーワード");

  // クエリパラメータの検証
  expect(apiClient.api.todos.$get).toHaveBeenCalledWith({
    query: { search: "検索キーワード" },
  });
});
```

## 5. ベストプラクティス

### beforeEach での初期化

```typescript
describe("Todo Use Cases", () => {
  beforeEach(() => {
    // 全てのモックをクリア
    vi.clearAllMocks();

    // デフォルトの成功レスポンスを設定
    vi.mocked(apiClient.api.todos.$get).mockResolvedValue(
      createMockTodosResponse([])
    );
  });

  // 個別テストでモックを上書き
  it("特定の条件でのテスト", async () => {
    vi.mocked(apiClient.api.todos.$get).mockResolvedValue(
      createMockTodosResponse([mockTodoVariations.completed])
    );
    // テスト実行...
  });
});
```

### モックファクトリーの活用

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

// テストでの使用
it("Todoが見つからない場合", async () => {
  setupFailedTodoFetch("notFound");

  const result = await fetchTodo(999);
  expect(result.isErr()).toBe(true);
});
```

### 型安全なモック設定

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

## 6. 注意事項

### setTimeout のモック化

```typescript
// テスト用の遅延処理をスキップ
beforeEach(() => {
  vi.spyOn(global, "setTimeout").mockImplementation((callback: any) => {
    callback();
    return {} as any;
  });
});
```

### モックの分離

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

### エラーハンドリングのテスト

```typescript
// Result型のエラー処理を必ずテスト
it("エラー時のResult型確認", async () => {
  setupFailedTodoFetch("serverError");

  const result = await fetchTodo(1);

  expect(result.isErr()).toBe(true);
  expect(result.isOk()).toBe(false);

  // 型安全なエラーハンドリング
  if (result.isErr()) {
    expect(result.error.type).toBe("TODO_FETCH_FAILED");
  }
});
```

この戦略により、Domain 層のビジネスロジックを外部依存から完全に分離し、確実で保守しやすいテストを実現できます。
