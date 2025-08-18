# コンポーネント実装ルール

## 概要

コンポーネントは、機能なしコンポーネントと機能ありコンポーネントの 2 種類に分類されます。

## 基本方針

### 機能なしコンポーネント

1. props を受け取って表示するのみ
2. 内部状態を持たない
3. ビジネスロジックを含まない
4. 再利用可能な UI 部品

### 機能ありコンポーネント

1. 複数の画面で共有される状態を管理
2. 特定の機能に特化した再利用可能なコンポーネント

## ファイル構成

```
component/
├── functional/           # 機能ありコンポーネント
│   └── todo/
│       ├── TodoList.tsx      # 一覧/詳細/編集画面で使用
└── functionless/        # 機能なしコンポーネント
    ├── general/         # 汎用コンポーネント
    │   ├── form/
    │   │   ├── InputText.tsx
    │   │   ├── InputTextArea.tsx
    │   │   └── SubmitButton.tsx
    │   ├── error/
    │   │   └── ErrorMessage.tsx
    │   └── loading/
    │       └── LoadingSpinner.tsx
    └── todo/           # 機能固有コンポーネント
        └── TodoForm.tsx
```

## 実装ルール

### 1. 機能なしコンポーネント

```typescript
// component/functionless/todo/TodoFormComponent.tsx
type BaseTodoFormProps = {
  formActionMethod?: (payload: FormData) => void;
  titleValue?: string;
  descriptionValue?: string;
  completedValue?: boolean;
  titleErrorMessage?: string;
  descriptionErrorMessage?: string;
  completedErrorMessage?: string;
  isPending?: boolean;
};

/**
 * 作成モード用のプロパティ
 * idValueは存在してはいけない
 */
type CreateTodoFormProps = BaseTodoFormProps & {
  mode: "create";
};

/**
 * 更新モード用のプロパティ
 * idValueは必須
 */
type UpdateTodoFormProps = BaseTodoFormProps & {
  mode: "update";
  idValue: string;
};

/**
 * 判別共用体による型定義
 * modeの値によってidValueの有無が決まる
 */
type TodoFormComponentProps = CreateTodoFormProps | UpdateTodoFormProps;

/**
 * Todo作成・更新用のフォームコンポーネント
 */
export function TodoFormComponent(props: TodoFormComponentProps) {
  const {
    mode,
    formActionMethod,
    titleValue,
    descriptionValue,
    completedValue,
    titleErrorMessage,
    descriptionErrorMessage,
    completedErrorMessage,
    isPending,
  } = props;
  const title = mode === "create" ? "新規作成" : "編集画面";

  return (
    <div className="p-8 bg-background">
      <h1 className="text-3xl font-bold text-foreground text-center">
        {title}
      </h1>

      <form
        key={JSON.stringify({ titleValue, descriptionValue, completedValue })}
        action={formActionMethod}
        className="flex flex-col space-y-4 max-w-[600px] mx-auto mt-8"
      >
        {/* 
          条件分岐内でprops.idValueにアクセス
          TypeScriptがmode === 'update'の場合にidValueが存在することを保証
        */}
        {mode === "update" && (
          <input type="hidden" name="todoId" value={props.idValue} />
        )}

        <InputText
          label="Title"
          name="title"
          placeholder="Enter title"
          defaultValue={titleValue}
          errorMessage={titleErrorMessage}
        />

        <InputTextArea
          label="Description"
          name="description"
          placeholder="Enter description"
          defaultValue={descriptionValue}
          errorMessage={descriptionErrorMessage}
        />

        <div className="flex items-center gap-2">
          <label
            htmlFor="completed"
            className="text-sm font-medium text-foreground"
          >
            Completed
          </label>
          <input
            type="checkbox"
            name="completed"
            defaultChecked={completedValue}
            className="h-4 w-4 text-primary border-gray-500 rounded"
          />
          {completedErrorMessage && (
            <p className="text-sm text-error">{completedErrorMessage}</p>
          )}
        </div>

        <div className="space-y-2">
          <SubmitButton size="lg" disabled={isPending}>
            {mode === "create" ? "作成" : "更新"}
          </SubmitButton>
          {isPending && (
            <div className="flex items-center justify-center gap-2 text-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">処理中...</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
```

### 2. 機能ありコンポーネント

現時点では利用することはないため、実装時に定義します

```typescript

```

## チェックリスト

### 機能なしコンポーネント

- [ ] props の型定義が適切
- [ ] 内部状態を持っていない
- [ ] イベントハンドラを props で受け取っている
- [ ] デザインシステムに準拠している

### 機能ありコンポーネント

### 共通

- [ ] コンポーネント名が適切
- [ ] 必要なテストが実装されている
- [ ] パフォーマンスを考慮している
- [ ] コードの重複がない
- [ ] 適切なコメントが記述されている
