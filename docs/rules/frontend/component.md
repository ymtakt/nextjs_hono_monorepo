# コンポーネント実装ルール

## 概要

コンポーネントは、機能なしコンポーネントと機能ありコンポーネントの 2 種類に分類されます。
両者の適切な使い分けにより、再利用性とテスタビリティを高めることができます。

## 基本方針

### 機能なしコンポーネント

1. props を受け取って表示するのみ
2. 内部状態を持たない
3. ビジネスロジックを含まない
4. 再利用可能な UI 部品

### 機能ありコンポーネント

1. 複数の画面で共有される状態を管理
2. 共通のイベントハンドラを実装
3. 機能なしコンポーネントを組み合わせる
4. 特定の機能に特化した再利用可能なコンポーネント

## ファイル構成

```
component/
├── functional/           # 機能ありコンポーネント
│   └── todo/
│       ├── TodoList.tsx      # 一覧/詳細/編集画面で使用
│       ├── TodoFilter.tsx    # 一覧/検索画面で使用
│       └── TodoStats.tsx     # 一覧/ダッシュボード画面で使用
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

```typescript
// component/functional/todo/TodoFilter.tsx
type Props = {
  current: string;
  onChange: (filter: string) => void;
};

export function TodoFilter({ current, onChange }: Props) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange("all")}
        className={`px-3 py-1.5 rounded-lg ${
          current === "all"
            ? "bg-primary text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        すべて
      </button>
      <button
        onClick={() => onChange("active")}
        className={`px-3 py-1.5 rounded-lg ${
          current === "active"
            ? "bg-primary text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        未完了
      </button>
      <button
        onClick={() => onChange("completed")}
        className={`px-3 py-1.5 rounded-lg ${
          current === "completed"
            ? "bg-primary text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        完了済み
      </button>
    </div>
  );
}
```

### 3. バリアント対応

```typescript
// component/functionless/general/form/SubmitButton.tsx
type Props = {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

export function SubmitButton({
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
}: Props) {
  const baseStyle = "font-medium rounded-lg transition-colors";

  const variantStyles = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary: "bg-gray-500 text-white hover:bg-gray-600",
    danger: "bg-error text-white hover:bg-error-dark",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={`
        ${baseStyle}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {loading ? "処理中..." : children}
    </button>
  );
}
```

### 4. アクセシビリティ対応

```typescript
// component/functionless/general/Modal.tsx
type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Modal({ isOpen, onClose, title, children }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      tabIndex={-1}
    >
      <div
        role="document"
        className="w-full max-w-md bg-background rounded-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-xl font-bold mb-4">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
```

## チェックリスト

### 機能なしコンポーネント

- [ ] props の型定義が適切
- [ ] 内部状態を持っていない
- [ ] イベントハンドラを props で受け取っている
- [ ] デザインシステムに準拠している
- [ ] アクセシビリティに配慮している

### 機能ありコンポーネント

- [ ] 複数画面での使用を考慮した設計になっている
- [ ] 共有される状態管理が適切
- [ ] 共有されるロジックが適切に実装されている
- [ ] 画面に応じた表示の切り替えが可能
- [ ] 画面に応じたイベントハンドリングが可能
- [ ] メモ化を必要に応じて使用
- [ ] 機能なしコンポーネントを適切に使用
- [ ] エラー状態を適切に処理

### 共通

- [ ] コンポーネント名が適切
- [ ] 必要なテストが実装されている
- [ ] パフォーマンスを考慮している
- [ ] コードの重複がない
- [ ] 適切なコメントが記述されている
