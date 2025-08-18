# Server Action 実装ルール

## 概要

Server Action は、Client Page からのフォーム送信を処理し、Domain Logic を呼び出すコンポーネントです。
バリデーション、エラーハンドリング、キャッシュの再検証を主な責務とします。

## 基本方針

1. 必ず"use server"ディレクティブを記述
2. Zod を使用したバリデーション
3. Domain Logic の`action`を使用したデータ操作
4. Result 型に基づくエラーハンドリング
5. 3 層構造のエラーメッセージ管理
6. 入力値保持による UX 向上

## ファイル構成

```
components/client-pages/
└── todo/
    ├── actions.ts           # Server Actions
    └── TodoListClientPage.tsx
```

## 実装ルール

### 1. エラーメッセージの 3 層構造

```typescript
// components/client-pages/todo/actions.ts
"use server";

/**
 * サーバーエラーメッセージ定義
 * ドメインロジックエラーなどで発生するエラーに使用
 */
const TODO_ACTION_ERROR_MESSAGES = {
  TODO_ID_NOT_FOUND: "TodoIDが見つかりません",
  TODO_CREATE_ERROR: "Todoの作成に失敗しました",
  TODO_UPDATE_ERROR: "Todoの更新に失敗しました",
  TODO_DELETE_ERROR: "Todoの削除に失敗しました",
} as const;

/**
 * バリデーションエラーの表示用メッセージ定義
 * zodバリデーションエラーの識別子と対応するユーザー表示用メッセージ
 */
const TODO_VALIDATION_ERROR_MESSAGES = {
  REQUIRED_TITLE: "タイトルは必須です",
  TITLE_TOO_LONG: "タイトルは100文字以内で入力してください",
  REQUIRED_DESCRIPTION: "説明を入力してください",
} as const;

/**
 * バリデーションエラーの識別子定義
 * zodのバリデーションメッセージで使用する識別子
 * アプリケーション内でエラーの種類を一意に識別するために使用
 */
const TODO_VALIDATION_ERRORS = {
  REQUIRED_TITLE: "REQUIRED_TITLE",
  TITLE_TOO_LONG: "TITLE_TOO_LONG",
  REQUIRED_DESCRIPTION: "REQUIRED_DESCRIPTION",
} as const;
```

### 2. フィールド優先順位とバリデーションスキーマ

```typescript
/**
 * Todoフォームフィールドの順序定義
 * バリデーションエラー表示時の優先順位を決定
 * 最初のエラーメッセージを取得する際にこの順序で確認される
 */
const TODO_FIELD_ORDER = ["title", "description", "completed"] as const;

/**
 * Todo作成・更新用のバリデーションスキーマ
 * エラーメッセージは識別子で管理し、後でユーザー表示用メッセージに変換される
 */
const todoActionFormSchema = z.object({
  title: z
    .string()
    .min(1, TODO_VALIDATION_ERRORS.REQUIRED_TITLE)
    .max(100, TODO_VALIDATION_ERRORS.TITLE_TOO_LONG),
  description: z.string().min(1, TODO_VALIDATION_ERRORS.REQUIRED_DESCRIPTION),
  completed: z.boolean(),
});
```

### 3. 型定義と ActionState

```typescript
/**
 * Todo用のバリデーションエラー型
 * 各フィールドに対応するエラーメッセージの配列を保持
 */
type TodoValidationErrors = {
  title: string[];
  description: string[];
  completed: string[];
};

/**
 * Todo作成・更新用のフォームフィールド型
 * エラー時の入力値保持やフォームの初期値設定に使用
 */
type TodoFormFields = {
  todoId?: string;
  title?: string;
  description?: string;
  completed?: boolean;
};

/**
 * Todo削除用のフォームフィールド型
 */
type DeleteTodoFields = {
  todoId?: string;
};

/**
 * ActionState型の使い分け
 * フォーム用：詳細なバリデーションエラーを含む
 * 削除用：シンプルな成功/失敗のみ
 */
export type TodoFormActionState = ActionState<
  TodoFormFields,
  TodoValidationErrors
>;
export type DeleteTodoActionState = ActionState<DeleteTodoFields>;
```

### 4. Server Action の実装（作成）

```typescript
/**
 * Todo作成用のServer Action
 *
 * 処理の流れ：
 * 1. FormDataからデータを取得
 * 2. zodでバリデーション実行
 * 3. バリデーションエラー時：エラー状態を返す（入力値保持）
 * 4. 成功時：use-case呼び出し → キャッシュ更新 → 成功状態を返す
 * 5. サーバーエラー時：エラー状態を返す（入力値保持）
 */
export async function createTodoAction(
  _: TodoFormActionState,
  formData: FormData
): Promise<TodoFormActionState> {
  // ✅ FormDataから値を取得（入力値保持用）
  const formFields: TodoFormFields = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    completed: formData.get("completed") === "on",
  };

  // ✅ zodを使用してバリデーション実行
  const validationResult = todoActionFormSchema.safeParse(formFields);

  if (!validationResult.success) {
    // ✅ バリデーションエラーの変換処理
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    const convertedErrors = convertValidationErrors<TodoValidationErrors>(
      fieldErrors,
      TODO_VALIDATION_ERROR_MESSAGES,
      TODO_FIELD_ORDER
    );

    return {
      ...formFields, // ✅ 入力値を保持
      status: ACTION_STATUS.VALIDATION_ERROR,
      error: getFirstValidationErrorMessage(convertedErrors, TODO_FIELD_ORDER),
      validationErrors: convertedErrors,
    };
  }

  // ✅ バリデーション済みデータでuse-case呼び出し
  const result = await createTodo(validationResult.data);

  if (result.isErr()) {
    return {
      ...formFields, // ✅ エラー時も入力値保持
      status: ACTION_STATUS.SERVER_ERROR,
      error: TODO_ACTION_ERROR_MESSAGES.TODO_CREATE_ERROR,
      validationErrors: null,
    };
  }

  // ✅ キャッシュ再検証
  revalidatePath("/");

  // ✅ 成功時はフィールドをクリア
  return {
    status: ACTION_STATUS.SUCCESS,
    error: null,
    validationErrors: null,
  };
}
```

### 5. Server Action の実装（更新）

```typescript
/**
 * Todo更新用のServer Action
 * 作成との違い：TodoIDの事前チェックが必要
 */
export async function updateTodoAction(
  prevState: TodoFormActionState,
  formData: FormData
): Promise<TodoFormActionState> {
  // ✅ TodoIDの存在確認
  const todoId = formData.get("todoId");
  if (!todoId) {
    return {
      ...prevState, // ✅ 前回の状態を保持
      status: ACTION_STATUS.VALIDATION_ERROR,
      error: TODO_ACTION_ERROR_MESSAGES.TODO_ID_NOT_FOUND,
      validationErrors: null,
    };
  }

  const formFields: TodoFormFields = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    completed: (formData.get("completed") === "on") as boolean,
  };

  // バリデーション実行（作成と同じロジック）
  const validationResult = todoActionFormSchema.safeParse(formFields);

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    const convertedErrors = convertValidationErrors<TodoValidationErrors>(
      fieldErrors,
      TODO_VALIDATION_ERROR_MESSAGES,
      TODO_FIELD_ORDER
    );
    return {
      ...formFields,
      status: ACTION_STATUS.VALIDATION_ERROR,
      error: getFirstValidationErrorMessage(convertedErrors, TODO_FIELD_ORDER),
      validationErrors: convertedErrors,
    };
  }

  const result = await updateTodo(Number(todoId), validationResult.data);

  if (result.isErr()) {
    return {
      ...formFields,
      status: ACTION_STATUS.SERVER_ERROR,
      error: TODO_ACTION_ERROR_MESSAGES.TODO_UPDATE_ERROR,
      validationErrors: null,
    };
  }

  // ✅ 複数パスの再検証
  revalidatePath("/");
  revalidatePath(`/edit/${todoId}`);

  return {
    status: ACTION_STATUS.SUCCESS,
    error: null,
    validationErrors: null,
  };
}
```

### 6. Server Action の実装（削除）

```typescript
/**
 * Todo削除用のServer Action
 * シンプルな操作のため、詳細なバリデーションは不要
 */
export async function deleteTodoAction(
  _: DeleteTodoActionState,
  formData: FormData
): Promise<DeleteTodoActionState> {
  const todoId = formData.get("todoId") as string;

  if (!todoId) {
    return {
      status: ACTION_STATUS.SERVER_ERROR,
      error: TODO_ACTION_ERROR_MESSAGES.TODO_ID_NOT_FOUND,
      validationErrors: null,
      todoId,
    };
  }

  const result = await deleteTodo(Number(todoId));

  if (result.isErr()) {
    return {
      status: ACTION_STATUS.SERVER_ERROR,
      error: TODO_ACTION_ERROR_MESSAGES.TODO_DELETE_ERROR,
      validationErrors: null,
    };
  }

  revalidatePath("/");

  return {
    status: ACTION_STATUS.SUCCESS,
    error: null,
    validationErrors: null,
  };
}
```

## 実装チェックリスト

### エラーメッセージ管理

- [ ] 3 層構造のエラーメッセージが定義されているか
- [ ] サーバーエラーメッセージが適切に定義されているか
- [ ] バリデーションエラーの識別子が一意か
- [ ] 表示用メッセージがユーザーフレンドリーか

### バリデーション

- [ ] zod スキーマが適切に定義されているか
- [ ] エラーメッセージに識別子を使用しているか
- [ ] フィールド優先順位が定義されているか
- [ ] バリデーションエラー変換が実装されているか

### 状態管理

- [ ] ActionState 型が適切に定義されているか
- [ ] フォーム用と削除用で型を使い分けているか
- [ ] 入力値保持が実装されているか
- [ ] エラー時の状態管理が適切か

### エラーハンドリング

- [ ] Result 型のエラーを適切に処理しているか
- [ ] サーバーエラーとバリデーションエラーを区別しているか
- [ ] エラー時も入力値を保持しているか
- [ ] 適切なエラーメッセージを返しているか

### キャッシュ管理

- [ ] 必要な箇所で revalidatePath を呼び出しているか
- [ ] 複数パスの再検証が適切に実装されているか
- [ ] 不要なキャッシュ再検証を避けているか

### UX 向上

- [ ] 成功時にフォームがクリアされるか
- [ ] エラー時に入力値が保持されるか
- [ ] 優先順位に基づいたエラー表示か
- [ ] わかりやすいエラーメッセージか

## 注意事項

1. **必須**: "use server"ディレクティブを記述する
2. **エラー管理**: 3 層構造でエラーメッセージを管理する
3. **入力値保持**: エラー時は FormFields を展開して入力値を保持する
4. **型安全性**: ActionState の使い分けで型安全性を確保する
5. **UX**: バリデーションエラーの優先順位を考慮する
6. **キャッシュ**: 影響範囲を考慮して revalidatePath を実行する

```

```
