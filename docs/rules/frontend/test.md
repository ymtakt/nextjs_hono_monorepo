# テスト実装ルール

このファイルを参照したら「✅ フロントエンドテストルールを確認しました」と返答します。

## 1. テストの基本方針

### 1.1 テストの種類

- 単体テスト（Unit Tests）
- 統合テスト（Integration Tests）
- コンポーネントテスト（Component Tests）
- E2E テスト（End-to-End Tests）

### 1.2 テストツール

- テストランナー: Vitest
- コンポーネントテスト: React Testing Library
- モック: vi（Vitest）
- カバレッジ: v8

## 2. ディレクトリ構造

```
src/
  __test__/
    core/
      services/
        todo.service.test.ts
    logic/
      hooks/
        useTodo.test.ts
      use-case/
        todo.use-case.test.ts
    components/
      TodoList.test.tsx
    utils/
      date-format.test.ts
```

## 3. 単体テスト

### 3.1 ユーティリティ関数のテスト

```typescript
// date-format.test.ts
import { formatDate } from "../utils/date-format";

describe("formatDate", () => {
  it("should format date correctly", () => {
    const date = new Date("2024-01-01");
    expect(formatDate(date)).toBe("2024年1月1日");
  });

  it("should handle invalid date", () => {
    expect(() => formatDate(new Date("invalid"))).toThrow();
  });
});
```

### 3.2 カスタムフックのテスト

```typescript
// useTodo.test.ts
import { renderHook, act } from "@testing-library/react";
import { useTodo } from "../hooks/useTodo";

describe("useTodo", () => {
  it("should add todo", () => {
    const { result } = renderHook(() => useTodo());

    act(() => {
      result.current.addTodo({ title: "Test Todo" });
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].title).toBe("Test Todo");
  });
});
```

## 4. コンポーネントテスト

### 4.1 表示のテスト

```typescript
// TodoList.test.tsx
import { render, screen } from "@testing-library/react";
import { TodoList } from "../components/TodoList";

describe("TodoList", () => {
  const todos = [{ id: "1", title: "Test Todo", completed: false }];

  it("should render todos", () => {
    render(<TodoList todos={todos} />);
    expect(screen.getByText("Test Todo")).toBeInTheDocument();
  });

  it("should show empty message when no todos", () => {
    render(<TodoList todos={[]} />);
    expect(screen.getByText("タスクがありません")).toBeInTheDocument();
  });
});
```

### 4.2 インタラクションのテスト

```typescript
// TodoItem.test.tsx
import { render, fireEvent } from "@testing-library/react";
import { TodoItem } from "../components/TodoItem";

describe("TodoItem", () => {
  const mockOnToggle = vi.fn();
  const todo = { id: "1", title: "Test Todo", completed: false };

  it("should call onToggle when clicked", () => {
    render(<TodoItem todo={todo} onToggle={mockOnToggle} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(mockOnToggle).toHaveBeenCalledWith("1");
  });
});
```

## 5. 統合テスト

### 5.1 サービスとの統合

```typescript
// todo-integration.test.ts
import { renderHook } from "@testing-library/react";
import { useTodos } from "../hooks/useTodos";
import { todoService } from "../services/todo.service";

vi.mock("../services/todo.service");

describe("Todo Integration", () => {
  it("should fetch and display todos", async () => {
    const mockTodos = [{ id: "1", title: "Test Todo", completed: false }];

    todoService.getTodos.mockResolvedValue(mockTodos);

    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.todos).toEqual(mockTodos);
    });
  });
});
```

### 5.2 フォームとバリデーション

```typescript
// todo-form-integration.test.tsx
import { render, fireEvent, waitFor } from "@testing-library/react";
import { TodoForm } from "../components/TodoForm";

describe("TodoForm Integration", () => {
  it("should validate and submit form", async () => {
    const onSubmit = vi.fn();
    render(<TodoForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "New Todo" },
    });

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: "New Todo",
        completed: false,
      });
    });
  });
});
```

## 6. モック

### 6.1 サービスのモック

```typescript
// todo.service.mock.ts
export const mockTodoService = {
  getTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
};

vi.mock("../services/todo.service", () => ({
  todoService: mockTodoService,
}));
```

### 6.2 フックのモック

```typescript
// useTodo.mock.ts
export const mockUseTodo = {
  todos: [],
  addTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
};

vi.mock("../hooks/useTodo", () => ({
  useTodo: () => mockUseTodo,
}));
```

## 7. テストカバレッジ

### 7.1 カバレッジ目標

- ステートメントカバレッジ: 80%以上
- ブランチカバレッジ: 80%以上
- 関数カバレッジ: 90%以上
- 行カバレッジ: 80%以上

### 7.2 カバレッジ設定

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      branches: 80,
      functions: 90,
      lines: 80,
      statements: 80,
    },
  },
});
```

## 8. テストユーティリティ

### 8.1 カスタムマッチャー

```typescript
// custom-matchers.ts
expect.extend({
  toBeValidTodo(received) {
    const isValid =
      received.id &&
      typeof received.title === "string" &&
      typeof received.completed === "boolean";

    return {
      pass: isValid,
      message: () => `Expected ${received} to be a valid todo`,
    };
  },
});
```

### 8.2 テストヘルパー

```typescript
// test-helpers.ts
export const createTestTodo = (override = {}) => ({
  id: "test-id",
  title: "Test Todo",
  completed: false,
  ...override,
});

export const renderWithProviders = (ui: React.ReactElement) => {
  return render(<TestProviders>{ui}</TestProviders>);
};
```

## 9. エラーケースのテスト

### 9.1 エラーハンドリング

```typescript
// error-handling.test.ts
describe("Error Handling", () => {
  it("should handle API errors", async () => {
    todoService.getTodos.mockRejectedValue(new Error("API Error"));

    render(<TodoList />);

    await waitFor(() => {
      expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
    });
  });
});
```

### 9.2 バリデーションエラー

```typescript
// validation.test.ts
describe("Form Validation", () => {
  it("should show error for empty title", () => {
    render(<TodoForm />);

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("タイトルは必須です")).toBeInTheDocument();
  });
});
```

## 10. パフォーマンステスト

### 10.1 レンダリングパフォーマンス

```typescript
// performance.test.ts
describe("Performance", () => {
  it("should render large lists efficiently", () => {
    const largeTodoList = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i}`,
      title: `Todo ${i}`,
      completed: false,
    }));

    const startTime = performance.now();
    render(<TodoList todos={largeTodoList} />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100); // 100ms以内
  });
});
```

### 10.2 メモ化のテスト

```typescript
// memo.test.tsx
describe("Memoization", () => {
  it("should not re-render unnecessarily", () => {
    const renderCount = vi.fn();

    const { rerender } = render(<MemoizedComponent onRender={renderCount} />);

    rerender(<MemoizedComponent onRender={renderCount} />);

    expect(renderCount).toHaveBeenCalledTimes(1);
  });
});
```
