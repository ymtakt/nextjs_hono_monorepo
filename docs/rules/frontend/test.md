# フロントエンドテスト方針

## 概要

**実行環境**: テストは Node.js 環境で実行されます（CI/CD 環境との統一のため）。

### テストの対象と構造

このプロジェクトでは、以下の 4 つの層をテスト対象とします：

1. **Core/Service 層**: 外界との通信設定と提供関数（API、S3、Firebase 等のクライアント初期化と操作関数）
2. **Domain Logic 層**: ビジネスロジック（SSR 用データ取得、Action 用データ操作、共通変換処理）
3. **Server Action 層**: フォーム処理とバリデーション（Client Page から Domain Logic を呼び出す）
4. **Utility 層**: 汎用的なヘルパー関数（日付フォーマット、バリデーション変換等）

### 依存関係とテスト戦略

**テストでの依存関係の扱い：**

- **Server Action** は Domain Logic に依存 → Domain Logic をモック化
- **Domain Logic** は Core/Service に依存 → Core/Service をモック化
- **Core/Service** は外界に依存 → 外界（AWS SDK、Firebase SDK 等）をモック化
- **Utility** は依存なし → そのままテスト

### 各層のテスト内容

#### Core/Service 層

- 設定や初期化が正しくできているか
- 自分たちが書いた処理ロジックが動くか（ライブラリが正常な場合）
- エラーが起きた時に適切な例外を投げるか

#### Domain Logic 層（logic/ssr/ logic/action/）

- 外界の通信（service 層）から返ってきたデータを正しく変換できるか
- 成功・失敗を適切に判定して返せるか
- エラーの種類を正しく分類できるか

#### Server Action 層

- フォームから送られたデータを正しく処理できるか（バリデーション）
- 画面の状態（成功・エラー）を適切に切り替えられるか（Action State）
- エラーメッセージをユーザーが分かる形に変換できるか

#### Utility 層（util/ logic/util）

- 入力データが期待通りの形式に正しく変換されるか
- 不完全・予期しないデータでも適切に処理できるか（想定外の状況でも壊れないこと）
- （ユーザーにとって使いやすい状態を保つこと）

#### カスタムフック 層（util/ logic/util）

- 初期状態が期待通りの値になっているか
- 操作が正しく機能するか
- 関連する値が期待するように連動して変化いるか
- 予期せぬ操作を繰り返しても大丈夫か

### テスト手法の特徴

**Result 型による統一的なエラーハンドリング：**
Domain Logic 層では、外界からのエラーを全て Result 型（`ok()`/`err()`）で統一して上位層に返します。テストでは`neverthrow`ライブラリを使って、成功時は`ok(mockData)`、エラー時は`err({ type: 'ERROR_TYPE' })`でモックを設定します。

**ActionState による状態管理：**
Server Action 層では、フォームの状態を`ActionState`で管理し、バリデーションエラー時は入力値を保持してユーザビリティを向上させます。テストでは、この状態遷移と入力値保持機能を重点的に検証します。

**外界の抽象化：**
Core/Service 層では、外界の詳細（AWS 固有のエラーコード等）を隠蔽し、一律で`throw new Error`によりアプリケーション固有のエラーメッセージをスローします。テストでは、外界でのエラーが適切に統一されたエラーメッセージに変換されることを確認します。

### テストの重要な観点

1. **基本機能**: 正常系の作成・取得・更新・削除、異常系のエラーハンドリング
2. **バリデーション**: 必須項目チェック、文字数制限、型変換の確認
3. **セキュリティ**: データ分離、認証チェック、権限管理
4. **エッジケース**: 空データ、境界値、null/undefined 処理
5. **データ整合性**: API-DB 間の一貫性、キャッシュ無効化の確認

フロントエンドのテストは、コンポーネントの責務に応じて適切なテスト手法を選択し、効率的かつ効果的なテストを実現します。
Vitest を使用し、各レイヤーに応じたテスト戦略を採用しています。

## テスト戦略

### テストの分類と責務

#### 1. Core/Service テスト

```typescript
// src/core/service/api/hono.service.test.ts
import { describe, expect, it, vi } from "vitest";
import { honoClient } from "@/core/service/api/hono.service";

describe("honoClient", () => {
  // 前提：honoClientが正しく設定されている
  // 期待値：APIクライアントとその構造が定義されている
  it("APIクライアントが正しく初期化される", () => {
    expect(honoClient).toBeDefined();
    expect(honoClient.api).toBeDefined();
    expect(honoClient.api.todos).toBeDefined();
  });

  // 前提：fetchをモック化し、honoClientでAPIを呼び出す
  // 期待値：正しいヘッダー（Content-Type）が設定されてリクエストされる
  it("正常系: リクエストヘッダーが正しく設定される", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    global.fetch = mockFetch;

    await honoClient.api.todos.$get();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });
});
```

```typescript
// src/core/service/storage/s3.service.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { S3Client } from "@aws-sdk/client-s3";
import { downloadFile } from "@/core/service/storage/s3.service";

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(),
  GetObjectCommand: vi.fn(),
}));

describe("s3Service", () => {
  const mockS3Client = {
    send: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(S3Client).mockImplementation(() => mockS3Client as any);
  });

  // 前提：S3Clientをモック化し、正常なレスポンスを返すよう設定
  // 期待値：ファイル内容がBufferで返され、正しいパラメータでS3が呼ばれる
  it("正常系: ファイルを正常に取得できる", async () => {
    const mockBody = Buffer.from("test file content");

    mockS3Client.send.mockResolvedValue({
      Body: {
        transformToByteArray: () => mockBody,
      },
    });

    const result = await downloadFile("test-file.txt");

    expect(result).toEqual(mockBody);
    expect(mockS3Client.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          Bucket: process.env.S3_BUCKET,
          Key: "test-file.txt",
        },
      })
    );
  });

  // 前提：S3Clientをモック化し、エラーを発生させる
  // 期待値：S3固有のエラーが隠蔽され、統一されたエラーメッセージがスローされる
  it("異常系: S3エラー時に一律エラーをスローする", async () => {
    mockS3Client.send.mockRejectedValue(new Error("S3 Access Denied"));

    await expect(downloadFile("test-file.txt")).rejects.toThrow(
      "ファイル取得に失敗しました"
    );
  });
});
```

#### 2. Server Action テスト

```typescript
// src/component/client-page/todo/action.test.ts
import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTodoAction } from "@/component/client-page/todo/action";
import { ACTION_STATUS } from "@/util/server-actions";

// モック設定
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/domain/logic/action/todo/create-todo", () => ({
  createTodo: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { createTodo } from "@/domain/logic/action/todo/create-todo";

// FormData作成ヘルパー
const createFormData = (data: Record<string, string | boolean>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(
      key,
      typeof value === "boolean" ? (value ? "on" : "off") : value
    );
  });
  return formData;
};

describe("createTodoAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 前提：有効なフォームデータが送信され、use-caseが成功する
  // 期待値：成功状態が返され、revalidatePathが呼ばれる
  it("有効なデータでTodo作成が成功する", async () => {
    const formData = createFormData({
      title: "新しいTodo",
      description: "新しい説明",
      completed: false,
    });

    vi.mocked(createTodo).mockResolvedValue(ok(mockTodoEntity));

    const result = await createTodoAction({}, formData);

    expect(result.status).toBe(ACTION_STATUS.SUCCESS);
    expect(result.error).toBeNull();
    expect(createTodo).toHaveBeenCalledWith({
      title: "新しいTodo",
      description: "新しい説明",
      completed: false,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  // 前提：titleが空のフォームデータが送信される
  // 期待値：バリデーションエラー状態が返され、入力値が保持される
  it("titleが空の場合バリデーションエラーが返される", async () => {
    const formData = createFormData({
      title: "",
      description: "説明",
      completed: false,
    });

    const result = await createTodoAction({}, formData);

    expect(result.status).toBe(ACTION_STATUS.VALIDATION_ERROR);
    expect(result.error).toBe("タイトルは必須です");
    expect(result.validationErrors?.title).toEqual(["タイトルは必須です"]);
    // 入力値保持の確認
    expect(result.title).toBe("");
    expect(result.description).toBe("説明");
    expect(createTodo).not.toHaveBeenCalled();
  });

  // 前提：有効なデータだがuse-caseがエラーを返す
  // 期待値：サーバーエラー状態が返され、入力値が保持される
  it("use-caseでエラーが発生した場合サーバーエラーが返される", async () => {
    const formData = createFormData({
      title: "タイトル",
      description: "説明",
      completed: false,
    });

    vi.mocked(createTodo).mockResolvedValue(
      err({ type: "TODO_CREATE_FAILED" })
    );

    const result = await createTodoAction({}, formData);

    expect(result.status).toBe(ACTION_STATUS.SERVER_ERROR);
    expect(result.error).toBe("Todoの作成に失敗しました");
    // エラー時も入力値保持
    expect(result.title).toBe("タイトル");
    expect(result.description).toBe("説明");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
```

#### 3. Domain Logic テスト

##### 3-1. SSR（データ取得）テスト

```typescript
// src/domain/logic/ssr/todo/fetch-todo.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/core/service/api.service";
import { fetchTodo } from "@/domain/logic/ssr/todo/fetch-todo";

vi.mock("@/core/service/api.service", () => ({
  apiClient: {
    api: {
      todos: {
        ":todoId": {
          $get: vi.fn(),
        },
      },
    },
  },
}));

describe("fetchTodo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 前提：APIクライアントをモック化し、正常なTodoレスポンスを返すよう設定
  // 期待値：APIレスポンスがTodoEntityに変換され、Result型のok()で返される
  it("正常系: Todoを取得して変換される", async () => {
    const mockTodo = {
      todo: {
        id: 1,
        title: "テストTodo",
        description: "テスト説明",
        completed: true,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-02T00:00:00Z",
      },
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockTodo),
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[":todoId"].$get).mockResolvedValue(
      mockResponse
    );

    const result = await fetchTodo(1);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({
        id: 1,
        title: "テストTodo",
        description: "テスト説明",
        isCompleted: true,
        createdDate: "2025-01-01T00:00:00Z",
        updatedDate: "2025-01-02T00:00:00Z",
      });
    }
  });

  // 前提：APIクライアントをモック化し、ok: falseのレスポンスを返すよう設定
  // 期待値：TODO_FETCH_FAILEDエラーがResult型のerr()で返される
  it("異常系: APIレスポンスが正常でない場合", async () => {
    const mockResponse = { ok: false };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos[":todoId"].$get).mockResolvedValue(
      mockResponse
    );

    const result = await fetchTodo(999);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toEqual({ type: "TODO_FETCH_FAILED" });
    }
  });
});
```

##### 3-2. Action（データ操作）テスト

```typescript
// src/domain/logic/action/todo/create-todo.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTodo } from "@/domain/logic/action/todo/create-todo";
import { apiClient } from "@/core/service/api.service";

vi.mock("@/core/service/api.service", () => ({
  apiClient: {
    api: {
      todos: {
        $post: vi.fn(),
      },
    },
  },
}));

describe("createTodo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 前提：APIクライアントをモック化し、正常なTodo作成レスポンスを返すよう設定
  // 期待値：作成されたTodoがEntityに変換され、Result型のok()で返される
  it("正常系: Todoが作成できる", async () => {
    const mockCreatedTodo = {
      todo: {
        id: 1,
        title: "テストTodo",
        description: "説明",
        completed: false,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockCreatedTodo),
    };

    // @ts-expect-error テスト用のmockなので型チェックをスキップ
    vi.mocked(apiClient.api.todos.$post).mockResolvedValue(mockResponse);

    const result = await createTodo({
      title: "テストTodo",
      description: "説明",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({
        id: 1,
        title: "テストTodo",
        description: "説明",
        isCompleted: false,
        createdDate: "2025-01-01T00:00:00Z",
        updatedDate: "2025-01-01T00:00:00Z",
      });
    }
  });

  // 前提：APIクライアントをモック化し、ネットワークエラーを発生させる
  // 期待値：TODO_CREATE_FAILEDエラーがResult型のerr()で返される
  it("異常系: API呼び出しが失敗する", async () => {
    vi.mocked(apiClient.api.todos.$post).mockRejectedValue(
      new Error("Network Error")
    );

    const result = await createTodo({
      title: "テストTodo",
      description: "説明",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toEqual({ type: "TODO_CREATE_FAILED" });
    }
  });
});
```

##### 3-3. Util（汎用ロジック）テスト

```typescript
// src/domain/logic/utils/todo/transform-to-todo-entity.test.ts
import { describe, expect, it } from "vitest";
import { transformToTodoEntity } from "@/domain/logic/utils/todo/transform-to-todo-entity";

describe("transformToTodoEntity", () => {
  // 前提：完全なプロパティを持つTodoオブジェクトが渡される
  // 期待値：すべてのフィールドが正しくTodoEntityにマッピングされる
  it("正常系: 完全なデータが正しく変換される", () => {
    const todoObject = {
      id: 1,
      title: "テストタスク",
      description: "テストの説明",
      completed: true,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-16T10:00:00Z",
    };

    const result = transformToTodoEntity(todoObject);

    expect(result).toEqual({
      id: 1,
      title: "テストタスク",
      description: "テストの説明",
      isCompleted: true,
      createdDate: "2024-01-15T10:00:00Z",
      updatedDate: "2024-01-16T10:00:00Z",
    });
  });

  // 前提：updatedAtが空文字のTodoオブジェクトが渡される
  // 期待値：updatedDateにcreatedAtの値が設定される
  it("エッジケース: updatedAtがない場合はcreatedAtが使用される", () => {
    const todoObject = {
      id: 3,
      title: "タスク",
      description: "説明",
      completed: false,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "",
    };

    const result = transformToTodoEntity(todoObject);

    expect(result.updatedDate).toBe("2024-01-15T10:00:00Z");
  });

  // 前提：descriptionが空文字のTodoオブジェクトが渡される
  // 期待値：descriptionが空文字として正しく変換される
  it("エッジケース: descriptionが空文字の場合", () => {
    const todoObject = {
      id: 2,
      title: "タスク",
      description: "",
      completed: false,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    };

    const result = transformToTodoEntity(todoObject);

    expect(result.description).toBe("");
  });
});
```

#### 4. Utility 関数テスト

```typescript
// src/util/server-actions.test.ts
import { describe, expect, it } from "vitest";
import {
  convertValidationErrors,
  getFirstValidationErrorMessage,
} from "@/util/server-actions";

describe("convertValidationErrors", () => {
  // 前提：zodのfieldErrorsと表示用メッセージマッピングが渡される
  // 期待値：エラーコードが表示用メッセージに正しく変換される
  it("正常系: バリデーションエラーを正しく変換する", () => {
    const fieldErrors = {
      title: ["REQUIRED_TITLE"],
      description: ["REQUIRED_DESCRIPTION"],
    };

    const errorMessages = {
      REQUIRED_TITLE: "タイトルは必須です",
      REQUIRED_DESCRIPTION: "説明は必須です",
    };

    const fieldOrder = ["title", "description"];

    const result = convertValidationErrors(
      fieldErrors,
      errorMessages,
      fieldOrder
    );

    expect(result).toEqual({
      title: ["タイトルは必須です"],
      description: ["説明は必須です"],
    });
  });

  // 前提：存在しないエラーコードを含むfieldErrorsが渡される
  // 期待値：存在しないエラーコードは無視され、空配列が設定される
  it("エッジケース: 存在しないエラーコードは無視される", () => {
    const fieldErrors = {
      title: ["UNKNOWN_ERROR"],
    };

    const errorMessages = {
      REQUIRED_TITLE: "タイトルは必須です",
    };

    const fieldOrder = ["title"];

    const result = convertValidationErrors(
      fieldErrors,
      errorMessages,
      fieldOrder
    );

    expect(result).toEqual({
      title: [],
    });
  });
});

describe("getFirstValidationErrorMessage", () => {
  // 前提：複数フィールドにエラーがあり、フィールド順序が指定される
  // 期待値：フィールド順序に基づいて最初のエラーメッセージが返される
  it("正常系: フィールド順序に基づいて最初のエラーを取得する", () => {
    const validationErrors = {
      title: ["タイトルエラー"],
      description: ["説明エラー"],
    };

    const fieldOrder = ["description", "title"];

    const result = getFirstValidationErrorMessage(validationErrors, fieldOrder);

    expect(result).toBe("説明エラー");
  });

  // 前提：エラーメッセージが存在しないvalidationErrorsが渡される
  // 期待値：nullが返される
  it("エッジケース: エラーがない場合はnullを返す", () => {
    const validationErrors = {
      title: [],
      description: [],
    };

    const fieldOrder = ["title", "description"];

    const result = getFirstValidationErrorMessage(validationErrors, fieldOrder);

    expect(result).toBeNull();
  });
});
```

#### 5. Utility カスタムフックテスト

```typescript
// src/util/hook/useModal.test.ts
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useModal } from "@/util/hook/useModal";

describe("useModal", () => {
  // 前提：初期状態でuseModalが呼び出される
  // 期待値：isOpenがfalse、dataがnullで初期化される
  it("初期状態が正しく設定される", () => {
    const { result } = renderHook(() => useModal());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBe(null);
    expect(typeof result.current.openModal).toBe("function");
    expect(typeof result.current.closeModal).toBe("function");
  });

  // 前提：initialOpenにtrueを指定してuseModalが呼び出される
  // 期待値：isOpenがtrueで初期化される
  it("初期状態をtrueに設定できる", () => {
    const { result } = renderHook(() => useModal(true));

    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toBe(null);
  });

  // 前提：openModal関数がデータなしで呼び出される
  // 期待値：isOpenがtrueになり、dataがnullのまま
  it("データなしでモーダルを開ける", () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.openModal();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toBe(null);
  });

  // 前提：openModal関数がデータ付きで呼び出される
  // 期待値：isOpenがtrueになり、渡されたデータが設定される
  it("データ付きでモーダルを開ける", () => {
    const { result } = renderHook(() =>
      useModal<{ id: number; name: string }>()
    );
    const testData = { id: 1, name: "テスト" };

    act(() => {
      result.current.openModal(testData);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toEqual(testData);
  });

  // 前提：モーダルが開いた状態でcloseModal関数が呼び出される
  // 期待値：isOpenがfalseになり、dataがnullにリセットされる
  it("モーダルを閉じると状態がリセットされる", () => {
    const { result } = renderHook(() => useModal<string>());
    const testData = "テストデータ";

    // モーダルを開く
    act(() => {
      result.current.openModal(testData);
    });

    // モーダルを閉じる
    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBe(null);
  });

  // 前提：openModal関数が複数回連続で呼び出される
  // 期待値：最後に渡されたデータが設定される
  it("複数回開くと最後のデータが保持される", () => {
    const { result } = renderHook(() => useModal<number>());

    act(() => {
      result.current.openModal(1);
    });

    act(() => {
      result.current.openModal(2);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toBe(2);
  });
});
```

## テストファイル構成

このプロジェクトでは、テストファイルを各モジュールと同じディレクトリに配置するコロケーション方式を採用しています。

```
src/
├── component/
│   └── client-page/
│       └── todo/
│           ├── action.test.ts
│           └── action.ts
├── core/
│   └── service/
│       └── api.service.ts (テスト未実装)
├── domain/
│   └── logic/
│       ├── action/
│       │   └── todo/
│       │       ├── create-todo.test.ts
│       │       ├── create-todo.ts
│       │       ├── delete-todo.test.ts
│       │       ├── delete-todo.ts
│       │       ├── update-todo.test.ts
│       │       └── update-todo.ts
│       ├── ssr/
│       │   └── todo/
│       │       ├── fetch-todo.test.ts
│       │       ├── fetch-todo.ts
│       │       ├── fetch-todos.test.ts
│       │       └── fetch-todos.ts
│       └── utils/
│           └── todo/
│               ├── transform-to-todo-entity.test.ts
│               └── transform-to-todo-entity.ts
└── util/
    ├── date-format.test.ts
    ├── date-format.ts
    ├── form-action-state.test.ts
    ├── form-action-state.ts
    ├── server-actions.test.ts
    ├── server-actions.ts
    └── hook/
        ├── useModal.test.ts
        └── useModal.ts
```

## テスト実行環境

### 実行コマンド

```bash
# 全テストの実行
npm run test

# 特定のテストファイルの実行
npm run test path/to/test.test.ts

# ウォッチモードでの実行
npm run test:watch

# カバレッジ付きで実行
npm run test:coverage

# レイヤー別テスト実行
npm run test src/core/
npm run test src/domain/
npm run test src/component/
npm run test src/util/
```

**注意**: テストは Node.js 環境で実行されます（CI/CD 環境との統一のため）。

## モック戦略

### 1. 基本的なモック設定

```typescript
// Next.js機能のモック
// revalidatePathはServer Actionでキャッシュを無効化する際に使用
// テストでは実際のキャッシュ操作は不要なので、関数の呼び出し確認のみ行う
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Domain Layer use-casesのモック
// Server ActionテストでDomain Logicの実装詳細をテストから分離
// 成功・失敗のパターンをResult型で制御可能
vi.mock("@/domain/logic/action/todo/create-todo", () => ({
  createTodo: vi.fn(),
}));

// 外部サービス（Core/Service層）のモック
// Domain LogicテストでAPIクライアントの実装詳細をテストから分離
// Hono RPCクライアントの構造に合わせてメソッドをモック化
vi.mock("@/core/service/api.service", () => ({
  apiClient: {
    api: {
      todos: {
        $get: vi.fn(), // GET /todos（一覧取得）
        $post: vi.fn(), // POST /todos（作成）
        ":todoId": {
          // 動的ルート /todos/:todoId
          $get: vi.fn(), // GET /todos/:todoId（詳細取得）
          $put: vi.fn(), // PUT /todos/:todoId（更新）
          $delete: vi.fn(), // DELETE /todos/:todoId（削除）
        },
      },
    },
  },
}));

// 外部SDK（AWS、Firebase等）のモック例
// Core/Serviceテストで外部ライブラリの実装詳細をテストから分離
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(), // S3クライアントのコンストラクタ
  GetObjectCommand: vi.fn(), // S3からファイル取得用のコマンド
}));
```

### 2. Result 型のモック

```typescript
import { ok, err } from "neverthrow";

// 成功時のモック設定
// Domain Logicが正常に動作した場合のレスポンスを模倣
// ok()でラップされたデータが返される
vi.mocked(createTodo).mockResolvedValue(ok(mockTodoEntity));

// エラー時のモック設定
// Domain Logicでエラーが発生した場合のレスポンスを模倣
// err()でラップされたエラーオブジェクトが返される
vi.mocked(createTodo).mockResolvedValue(err({ type: "TODO_CREATE_FAILED" }));

// 使用例：Server Actionテストでの成功パターン
it("成功パターンのテスト", async () => {
  // createTodoが成功するようモック設定
  vi.mocked(createTodo).mockResolvedValue(
    ok({
      id: 1,
      title: "新しいTodo",
      description: "説明",
      isCompleted: false,
    })
  );

  const result = await createTodoAction({}, formData);
  expect(result.status).toBe(ACTION_STATUS.SUCCESS);
});

// 使用例：Server Actionテストでのエラーパターン
it("エラーパターンのテスト", async () => {
  // createTodoがエラーを返すようモック設定
  vi.mocked(createTodo).mockResolvedValue(
    err({
      type: "TODO_CREATE_FAILED",
    })
  );

  const result = await createTodoAction({}, formData);
  expect(result.status).toBe(ACTION_STATUS.SERVER_ERROR);
});
```

### 3. モック使用時の注意点

```typescript
describe("テストスイート", () => {
  beforeEach(() => {
    // 各テストケース実行前に全モックをリセット
    // 前のテストの設定が後続のテストに影響しないようにする
    vi.clearAllMocks();
  });

  it("モック呼び出し確認の例", async () => {
    // モックの戻り値を設定
    vi.mocked(createTodo).mockResolvedValue(ok(mockData));

    // テスト対象の関数を実行
    await createTodoAction({}, formData);

    // モックが期待する引数で呼び出されたか確認
    expect(createTodo).toHaveBeenCalledWith({
      title: "テスト",
      description: "説明",
    });

    // モックが1回だけ呼び出されたか確認
    expect(createTodo).toHaveBeenCalledTimes(1);

    // モックが呼び出されなかったことを確認
    expect(someOtherFunction).not.toHaveBeenCalled();
  });
});

// @ts-expect-error の使用について
// TypeScriptの型チェックでエラーになるモック設定で使用
// テスト専用のモックなので型安全性よりもテストの実行を優先
// @ts-expect-error テスト用のmockなので型チェックをスキップ
vi.mocked(apiClient.api.todos[":todoId"].$get).mockResolvedValue(mockResponse);
```

## テストのベストプラクティス

### 1. テストケースの構造

```typescript
// ✅ 良い例：前提条件と期待値を明確に記述
it("有効なデータでTodo作成が成功する", async () => {
  // 前提：有効なフォームデータが送信され、use-caseが成功する
  // 期待値：成功状態が返され、revalidatePathが呼ばれる
});

// ❌ 悪い例：説明が不十分
it("test create todo", async () => {});
```

### 2. モックの使い方

```typescript
// ✅ 良い例：neverthrowのok/errを使用
vi.mocked(createTodo).mockResolvedValue(ok(mockTodoEntity));
vi.mocked(createTodo).mockResolvedValue(err({ type: "TODO_CREATE_FAILED" }));

// ✅ 良い例：呼び出し確認
expect(createTodo).toHaveBeenCalledWith({
  title: "テスト",
  description: "説明",
});
expect(revalidatePath).toHaveBeenCalledWith("/");

// ✅ 良い例：呼び出されないことの確認
expect(createTodo).not.toHaveBeenCalled();
```

### 3. アサーションのパターン

```typescript
// ✅ Result型の検証
expect(result.isOk()).toBe(true);
if (result.isOk()) {
  expect(result.value).toEqual(expectedEntity);
}

// ✅ ActionStateの検証
expect(result.status).toBe(ACTION_STATUS.SUCCESS);
expect(result.error).toBeNull();
expect(result.validationErrors).toBeNull();

// ✅ 入力値保持の確認
expect(result.title).toBe("入力されたタイトル");
expect(result.description).toBe("入力された説明");
```

### 4. beforeEach でのクリーンアップ

```typescript
describe("テストスイート", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // 毎回モックをリセット
  });
});
```

## フロントエンドテストチェックリスト

### 1. Core/Service テスト

**外界（AWS SDK、Firebase SDK 等）をモック化**

- [ ] 設定や初期化が正しくできているか
- [ ] 自分たちが書いた処理ロジックが動くか（ライブラリが正常な場合）
- [ ] エラーが起きた時に適切な例外を投げるか

### 2. Domain Logic テスト

**Core/Service をモック化**

- [ ] 外界の通信から返ってきたデータを正しく変換できるか
- [ ] 成功・失敗を適切に判定して返せるか（Result 型）
- [ ] エラーの種類を正しく分類できるか

### 3. Server Action テスト

**Domain Logic をモック化**

- [ ] フォームから送られたデータを正しく処理できるか（バリデーション）
- [ ] 画面の状態（成功・エラー）を適切に切り替えられるか（Action State）
- [ ] エラーメッセージをユーザーが分かる形に変換できるか

### 4. Utility テスト

**依存なし → そのままテスト**

#### 汎用関数・変換処理

- [ ] 入力データが期待通りの形式に正しく変換されるか
- [ ] 不完全・予期しないデータでも適切に処理できるか
- [ ] ユーザーにとって使いやすい状態を保つこと

#### カスタムフック

- [ ] 初期状態が期待通りの値になっているか
- [ ] 操作が正しく機能するか
- [ ] 関連する値が期待するように連動して変化するか
- [ ] 予期せぬ操作を繰り返しても大丈夫か

### 5. 共通チェック項目

#### テスト品質

- [ ] 前提条件と期待値がコメントで明記されているか
- [ ] `beforeEach(() => { vi.clearAllMocks(); })` が実装されているか
- [ ] 正常系・異常系の両方がテストされているか

#### モック設定

- [ ] 外部依存が適切にモック化されているか
- [ ] Result 型（ok/err）が正しく使用されているか
- [ ] モック呼び出し確認が実装されているか
