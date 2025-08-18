# クライアントページ実装ルール

## 概要

クライアントページは、特定の画面に対して 1:1 で作成される、ページ固有のコンポーネントです。
React Hooks や UI ロジック、副作用を含むことができ、"use client"または"use server"のどちらでも実装可能です。
ページコンポーネントから受け取ったデータを表示し、ユーザーの操作に応じて Server Action を呼び出します。

## 基本方針

1. 画面に対して 1:1 で作成
2. React Hooks、UI ロジック、副作用を含むことができる
3. "use client"または"use server"を選択可能
4. 状態管理（React hooks）
5. エラー表示（toast）

## ファイル構成

```
component/
└── client-page/
    └── todo/
        ├── action.ts          # フォームアクションロジック
        ├── TodoListClientPage.tsx
        ├── TodoDetailClientPage.tsx
        ├── TodoEditClientPage.tsx
        └── TodoRegisterClientPage.tsx
```

### action.ts の役割

`action.ts`は、クライアントページの操作を理解しているフォームアクションロジックを定義します。
ドメインロジックとは異なり、UI の状態やフォームの処理に特化しています。

```typescript
// action.tsの例
export async function createTodoAction(formData: FormData) {
  // フォームのバリデーション
  const title = formData.get("title");
  if (!title) {
    return {
      success: false,
      error: {
        type: "VALIDATION_ERROR",
        message: "タイトルは必須です",
      },
    };
  }

  // UIの状態を考慮したバリデーション
  if (title.length > 100) {
    return {
      success: false,
      error: {
        type: "VALIDATION_ERROR",
        message: "タイトルは100文字以内で入力してください",
      },
    };
  }

  // ドメインロジックの呼び出し
  const result = await createTodoLogic({
    title: title.toString(),
    description: formData.get("description")?.toString() || "",
  });

  if (result.isErr()) {
    return {
      success: false,
      error: result.error,
    };
  }

  // UI固有の成功処理
  revalidatePath("/todo");
  return {
    success: true,
    data: result.value,
  };
}
```

## 実装ルール

### 1. 基本構造

```typescript
// component/client-page/todo/TodoEditClientPage.tsx
"use client";

type TodoEditProps = {
  todo: TodoEntity;
};

/**
 * todoの編集ページのコンポーネント
 *
 * - 特定のTodoEntityをpropsとして受け取る
 * - 受け取ったTodoEntityを表示する
 * - client component
 * - React Hooksを使用することが可能
 * - TodoFormComponentを使用してTodoの編集フォームを表示する
 * - 更新成功後は詳細画面に遷移する
 */
export function TodoEditClientPage({ todo }: TodoEditProps) {
  const router = useRouter();

  // 初期状態を作成
  const initialState: TodoFormActionState = createInitialFormActionState();
  initialState.title = todo.title;
  initialState.description = todo.description;
  initialState.completed = todo.isCompleted;

  // Server Actionをラップ
  const wrappedAction = withServerActionHandling(updateTodoAction, {
    onSuccess: ({ success }) => {
      success("更新しました");
      router.push(`/`);
    },
    initialState,
  });

  // useActionStateフック
  const [state, formAction, isPending] = useActionState<
    TodoFormActionState,
    FormData
  >(wrappedAction, initialState);

  return (
    <TodoFormComponent
      mode={"update"}
      idValue={todo.id.toString()}
      formActionMethod={formAction}
      titleValue={state.title ?? todo?.title ?? ""}
      descriptionValue={state.description ?? todo?.description ?? ""}
      completedValue={state.completed ?? todo?.isCompleted ?? false}
      titleErrorMessage={state.validationErrors?.title?.[0]}
      descriptionErrorMessage={state.validationErrors?.description?.[0]}
      completedErrorMessage={state.validationErrors?.completed?.[0]}
      isPending={isPending}
    />
  );
}
```

### 2. フォームアクションロジック

```typescript
// component/client-page/todo/action.ts
"use server";

/**
 * Todoアクションのサーバーエラーメッセージ定義
 */
const TODO_ACTION_ERROR_MESSAGES = {
  TODO_ID_NOT_FOUND: "TodoIDが見つかりません",
  TODO_CREATE_ERROR: "Todoの作成に失敗しました",
  TODO_UPDATE_ERROR: "Todoの更新に失敗しました",
  TODO_DELETE_ERROR: "Todoの削除に失敗しました",
} as const;

/**
 * Todoバリデーションエラーの表示用メッセージ定義
 */
const TODO_VALIDATION_ERROR_MESSAGES = {
  REQUIRED_TITLE: "タイトルは必須です",
  TITLE_TOO_LONG: "タイトルは100文字以内で入力してください",
  REQUIRED_DESCRIPTION: "説明を入力してください",
} as const;

/**
 * Todo作成・更新用のバリデーションスキーマ
 */
const todoActionFormSchema = z.object({
  title: z
    .string()
    .min(1, TODO_VALIDATION_ERROR_MESSAGES.REQUIRED_TITLE)
    .max(100, TODO_VALIDATION_ERROR_MESSAGES.TITLE_TOO_LONG),
  description: z
    .string()
    .min(1, TODO_VALIDATION_ERROR_MESSAGES.REQUIRED_DESCRIPTION),
  completed: z.boolean(),
});

/**
 * Todo更新用のServer Action
 */
export async function updateTodoAction(
  prevState: TodoFormActionState,
  formData: FormData
): Promise<TodoFormActionState> {
  // TodoIDの存在確認
  const todoId = formData.get("todoId");
  if (!todoId) {
    return {
      ...prevState,
      status: ACTION_STATUS.VALIDATION_ERROR,
      error: TODO_ACTION_ERROR_MESSAGES.TODO_ID_NOT_FOUND,
      validationErrors: null,
    };
  }

  // フォームデータの取得
  const formFields: TodoFormFields = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    completed: (formData.get("completed") === "on") as boolean,
  };

  // バリデーション実行
  const validationResult = todoActionFormSchema.safeParse(formFields);

  // バリデーションエラー時
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

  // ドメインロジックの呼び出し
  const result = await updateTodo(Number(todoId), validationResult.data);

  // エラー時
  if (result.isErr()) {
    return {
      ...formFields,
      status: ACTION_STATUS.SERVER_ERROR,
      error: TODO_ACTION_ERROR_MESSAGES.TODO_UPDATE_ERROR,
      validationErrors: null,
    };
  }

  // キャッシュの更新
  revalidatePath("/");
  revalidatePath(`/edit/${todoId}`);

  // 成功時
  return {
    status: ACTION_STATUS.SUCCESS,
    error: null,
    validationErrors: null,
  };
}
```

### 3. 状態管理とイベントハンドリング

```typescript
// component/client-page/todo/TodoListClientPage.tsx
export function TodoListClientPage({ todos }: TodoListProps) {
  const router = useRouter();
  const { error } = useToast();
  const [isLoading, startTransition] = useTransition();

  // URLクエリパラメータと連動するステート
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);

  // モーダル状態の管理
  const deleteModal = useModal<{ id: number; title: string }>();

  // 検索ハンドラ
  const handleSearch = (formData: FormData) => {
    startTransition(() => {
      const searchValue = formData.get("search") as string;
      const validationResult = searchTodoFormSchema.safeParse({
        search: searchValue,
      });

      if (!validationResult.success) {
        const errorCode = extractZodErrorMessage(validationResult.error);
        const errorMessage =
          SEARCH_ERROR_MESSAGES[errorCode] || "検索でエラーが発生しました";
        error(errorMessage);
        return;
      }

      router.replace(`/?search=${searchValue}`);
    });
  };

  return (
    <>
      {isLoading && <ClientComponentLoading />}
      <SearchBox
        search={search}
        setSearch={setSearch}
        handleSearch={handleSearch}
      />
      {/* ... */}
    </>
  );
}
```

## チェックリスト

### 基本実装

- [ ] 画面に対して 1:1 で作成されている
- [ ] 適切なディレクティブ（"use client"/"use server"）を使用している
- [ ] props の型定義が適切
- [ ] 必要な状態を React hooks で管理している
- [ ] 画面固有のロジックが実装されている
- [ ] 適切な Server Action を呼び出している

### エラーハンドリング

- [ ] Server Action のエラーを適切に処理している
- [ ] エラーメッセージを toast で表示している
- [ ] エラーの種類に応じた処理を実装している

### UI/UX

- [ ] ローディング状態を表示している
- [ ] 成功時のフィードバックを表示している
- [ ] 適切なナビゲーションを実装している
- [ ] 機能なしコンポーネントを適切に使用している
