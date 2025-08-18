# フロントエンドテスト方針

## 概要

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

- **設定テスト**: API クライアントの初期化、環境変数チェック
- **提供関数**: 外部ライブラリをモック化した上で、操作関数（`downloadFile`、`fetchUsers`等）のエラーハンドリングと戻り値の確認
- **エラーハンドリング**: 外界固有エラーの統一的な変換
- **通信テスト**: リクエストヘッダー、レスポンス処理の確認
- **ライブラリ統合**: 外部 SDK（AWS SDK、Firebase SDK 等）の適切なモック化

#### Domain Logic 層

- **ビジネスロジック**: データの作成・取得・更新・削除処理
- **Result 型検証**: 成功時の`ok()`、エラー時の`err()`の適切な返却
- **データ変換**: API レスポンス ↔ Entity 間の変換ロジック
- **エラーケース**: 外界エラーのアプリケーション固有エラーへの変換

#### Server Action 層

- **フォーム処理**: FormData の取得と型変換
- **バリデーション**: Zod を使った入力値検証とエラーメッセージ変換
- **状態遷移**: ActionState の適切な状態管理
- **入力値保持**: エラー時のユーザー入力値保持機能
- **キャッシュ管理**: revalidatePath の適切な呼び出し

#### Utility 層

- **純粋関数**: 入力に対する期待される出力の確認
- **エッジケース**: null、undefined、空文字等の境界値処理
- **エラーハンドリング**: 不正な入力に対する適切なフォールバック

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

- API クライアントの設定テスト
- エラーハンドリングのテスト
- 環境変数とクライアント初期化
- 外界サービスとの統合テスト

```typescript
// __test__/core/service/api/hono.service.test.ts
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
// __test__/core/service/storage/s3.service.test.ts
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

- フォームデータの処理とバリデーション
- ActionState の状態遷移
- 入力値保持機能
- エラーメッセージ変換

```typescript
// __test__/component/client-page/todo/action.test.ts
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
// __test__/domain/logic/ssr/todo/fetch-todo.test.ts
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
// __test__/domain/logic/action/todo/create-todo.test.ts
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
// __test__/domain/logic/util/todo/transform-to-todo-entity.test.ts
import { describe, expect, it } from "vitest";
import { transformToTodoEntity } from "@/domain/logic/util/todo/transform-to-todo-entity";

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
// __test__/util/server-actions.test.ts
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

```typescript
// __test__/util/hook/useModal.test.ts
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

## テストの観点

### 1. 基本機能

- **正常系**: 作成・取得・更新・削除が成功する
- **異常系**: バリデーションエラーが適切に返される
- **エッジケース**: 境界値や特殊なケースでの動作確認

### 2. バリデーション

- **必須項目**: 空文字でエラーになる
- **文字数制限**: 上限を超えるとエラーになる
- **型変換**: フォームデータの型変換が正しく行われる

### 3. エラーハンドリング

- **Result 型**: 成功時と失敗時の適切な型検証
- **エラー統一**: 外界固有のエラーが適切に隠蔽される
- **エラーメッセージ**: ユーザーフレンドリーなメッセージ変換

### 4. データ整合性

- **変換ロジック**: API ↔ Entity 間の変換が正確
- **状態管理**: ActionState の状態遷移が正しい
- **入力値保持**: エラー時の入力値保持機能

### 5. セキュリティと設定

- **環境変数**: 必要な設定値の検証
- **認証**: 認証済みユーザーのみアクセス可能
- **データ分離**: 他ユーザーのデータは取得できない

## テストファイル構成

```
__test__/
├── component/
│   └── client-page/
│       └── todo/
│           └── action.test.ts
├── core/
│   └── service/
│       ├── api/
│       │   └── hono.service.test.ts
│       ├── storage/
│       │   └── s3.service.test.ts
│       └── firebase/
│           └── firestore.service.test.ts
├── domain/
│   └── logic/
│       ├── action/
│       │   └── todo/
│       │       ├── create-todo.test.ts
│       │       └── update-todo.test.ts
│       ├── ssr/
│       │   └── todo/
│       │       └── fetch-todo.test.ts
│       └── util/
│           └── todo/
│               └── transform-to-todo-entity.test.ts
└── util/
    ├── server-actions.test.ts
    ├── date-format.test.ts
    └── hook/
        └── useActionState.test.ts
```

## テスト実行環境

### 実行コマンド

```bash
# 全テストの実行
bun run test

# 特定のテストファイルの実行
bun run test path/to/test.test.ts

# ウォッチモードでの実行
bun run test:watch

# カバレッジ付きで実行
bun run test:coverage

# レイヤー別テスト実行
bun run test __test__/core/
bun run test __test__/domain/
bun run test __test__/component/
bun run test __test__/util/
```

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

### Core/Service テスト

- [ ] クライアント初期化の検証が実装されているか
- [ ] 環境変数チェックが実装されているか
- [ ] エラーハンドリングの統一性が検証されているか
- [ ] 外界固有のエラーが隠蔽されているか
- [ ] 型安全性が検証されているか
- [ ] セキュリティ設定が検証されているか

### Server Action テスト

- [ ] フォームデータの処理が検証されているか
- [ ] バリデーションエラーのテストが実装されているか
- [ ] 成功時のレスポンスが検証されているか
- [ ] エラー時のレスポンスが検証されているか
- [ ] 入力値保持の動作が検証されているか
- [ ] Next.js 機能（revalidatePath）のモックが適切か

### Domain Logic テスト

- [ ] 成功ケースのテストが実装されているか
- [ ] エラーケースのテストが実装されているか
- [ ] 外部依存がモックに置き換えられているか
- [ ] Result 型の検証が適切か
- [ ] 前提条件と期待値がコメントで明記されているか
- [ ] データ変換ロジックが正確に動作するか

### Utility テスト

- [ ] 正常系のテストが実装されているか
- [ ] エッジケースのテストが実装されているか
- [ ] 入力値の境界値テストが実装されているか
- [ ] 戻り値の型が正しいか
- [ ] null/undefined 処理が適切か
- [ ] エラーメッセージ変換が正確か

### 共通項目

- [ ] テストケース名が明確で理解しやすいか
- [ ] 前提条件と期待値がコメントで記述されているか
- [ ] モックの設定が適切で最小限か
- [ ] `@ts-expect-error`の使用が適切か
- [ ] beforeEach/afterEach でのクリーンアップが実装されているか
- [ ] テストの独立性が保たれているか

## 注意事項

1. **モックの適切な使用**: 外部依存は必ずモックに置き換える
2. **Result 型の検証**: `isOk()`/`isErr()`での型安全な検証を行う
3. **前提条件の明記**: 各テストケースの前提条件をコメントで記述
4. **エラーケースの網羅**: 正常系だけでなく異常系も必ずテストする
5. **独立性の確保**: 各テストが他のテストに依存しないよう設計する
