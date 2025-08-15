# Frontend テスト実装ガイド

このファイルを参照したら「✅Frontend のテストの実装ルールを確認しました」と返答します。

## 1. テストの実行方法

```sh
npm run test
```

で watch モードでテストを実行します。

```sh
npm run test:run
```

で watch せずに一度だけ実行します。

## 2. テストの基本方針

Frontend のテストは **ユニットテストのみ** を実施し、コンポーネントテストは行いません。以下の層をテスト対象とします：

- **core/** - 複雑なロジックを含むサービス層
- **domain/** - ビジネスロジックとドメイン知識
- **util/** - ユーティリティ関数とカスタムフック
- **client-page/action.ts** - Server Action のロジック

## 3. テストの基本構造

各テストケースは以下の構造で実装し、それぞれにコメントを記述します：

### 3.1 前提条件と期待値のコメント

```typescript
// 前提：有効なフォームデータが送信され、use-caseが成功する
// 期待値：成功状態が返され、revalidatePathが呼ばれる
it('有効なデータでTodo作成が成功する', async () => {
  // テスト実装...
})
```

### 3.2 テストコードの構造

```typescript
describe('fetchTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('正常にTodoを取得して変換される', async () => {
    // Arrange: テストデータの準備
    const mockResponse = createMockTodoResponse()
    vi.mocked(apiClient.api.todos[':todoId'].$get).mockResolvedValue(mockResponse)

    // Act: 関数の実行
    const result = await fetchTodo(1)

    // Assert: 結果の検証
    expect(result.isOk()).toBe(true)
    expect(apiClient.api.todos[':todoId'].$get).toHaveBeenCalledWith({
      param: { todoId: '1' }
    })
  })
})
```

## 4. 層別テスト方針

### 4.1 core/ layer

#### 4.1.1 テスト対象

**複雑なロジックを含むサービス層のみ**
- カスタマイズされたAPIクライアント（認証、インターセプター等）
- 外部SDK（S3、Firebase等）のラッパー関数
- 外部サービスとの複雑な統合処理

**テスト対象外**
- 単純な設定ファイル（現在のapi.service.tsのような環境変数読み込みのみ）
- 設定値の定義
- 外部ライブラリの単純な初期化

#### 4.1.2 テスト例（将来的な拡張時）

```typescript
// 例：認証機能付きAPIクライアント
describe('authenticatedApiClient', () => {
  // 前提：有効な認証トークンが設定される
  // 期待値：リクエストにAuthorizationヘッダーが追加される
  it('認証トークンがヘッダーに追加される', async () => {
    const client = createAuthenticatedApiClient('test-token')
    
    // モックでリクエストを監視
    const mockFetch = vi.fn()
    global.fetch = mockFetch
    
    await client.api.todos.$get()
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      })
    )
  })
})

// 例：S3アップロード機能
describe('uploadToS3', () => {
  // 前提：有効なファイルとS3設定が渡される
  // 期待値：S3にファイルがアップロードされ、URLが返される
  it('ファイルをS3にアップロードしURLを返す', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    // S3クライアントをモック
    vi.mocked(s3Client.upload).mockResolvedValue({ Location: 'https://s3.amazonaws.com/bucket/test.txt' })
    
    const result = await uploadToS3(file, 'test-bucket')
    
    expect(result).toBe('https://s3.amazonaws.com/bucket/test.txt')
  })
})
```

### 4.2 domain/ layer

#### 4.2.1 domain/logic/ssr/ & domain/logic/action/

**テスト対象**
- API呼び出しの成功・失敗パターン
- Entity変換処理の動作確認
- パラメータの適切な変換（number → string等）
- Result型のエラーハンドリング

**テスト例**
```typescript
describe('fetchTodo', () => {
  // 前提：APIが正常なレスポンスを返す
  // 期待値：変換されたTodoEntityがok結果で返される
  it('正常にTodoを取得して変換される', async () => {
    const mockResponse = createMockTodoResponse({
      id: 1,
      title: 'テストTodo',
      completed: false
    })
    
    vi.mocked(apiClient.api.todos[':todoId'].$get).mockResolvedValue(mockResponse)
    
    const result = await fetchTodo(1)
    
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.title).toBe('テストTodo')
      expect(result.value.isCompleted).toBe(false)
    }
  })
})
```

#### 4.2.2 domain/logic/util/

**テスト対象**
- Entity変換処理（transformToTodoEntity等）
- 条件分岐を含む変換ロジック
- フォールバック処理（null/undefined対応）

**テスト例**
```typescript
describe('transformToTodoEntity', () => {
  // 前提：完全なデータを持つTodoオブジェクトが渡される
  // 期待値：すべてのフィールドが正しくマッピングされたTodoEntityが返される
  it('完全なデータが正しく変換される', () => {
    const todoObject = {
      id: 1,
      title: 'テストタスク',
      description: 'テストの説明',
      completed: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-16T10:00:00Z',
    }

    const result = transformToTodoEntity(todoObject)

    expect(result).toEqual({
      id: 1,
      title: 'テストタスク',
      description: 'テストの説明',
      isCompleted: true,
      createdDate: '2024-01-15T10:00:00Z',
      updatedDate: '2024-01-16T10:00:00Z',
    })
  })
})
```

### 4.3 util/ layer

#### 4.3.1 util/関数

**テスト対象**
- 最も重要な正常系をカバー
- 基本的な異常系をカバー

**テスト対象外**
- 型定義や定数

**テスト例**
```typescript
describe('formatDateToJapanese', () => {
  // 前提：有効なISO形式の日付文字列が渡される
  // 期待値：日本語ロケールでフォーマットされた日付文字列が返される
  it('有効なISO日付文字列が正しくフォーマットされる', () => {
    const dateString = '2024-01-15T00:00:00Z'
    const result = formatDateToJapanese(dateString)

    expect(result).toBe('2024/1/15')
  })

  // 前提：無効な日付文字列が渡される
  // 期待値：「日付不明」が返される
  it('無効な日付文字列が渡される', () => {
    const dateString = 'invalid'
    const result = formatDateToJapanese(dateString)

    expect(result).toBe('日付不明')
  })
})
```

#### 4.3.2 util/hook/ カスタムフック

**テスト対象**
- フック内の状態管理ロジック（useState、useEffect等の動作）を検証する
- 複雑な状態変更や条件分岐を含むフックのみをテスト対象とする

**テスト対象外**
- UI表示やスタイルの確認
- タイマーやアニメーションの動作
- クリックやキーボード入力などの操作
- DOM要素の取得や変更

**テスト例**
```typescript
describe('useModal', () => {
  // 前提：初期状態でuseModalが呼び出される
  // 期待値：isOpenがfalse、dataがnullで初期化される
  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useModal())

    expect(result.current.isOpen).toBe(false)
    expect(result.current.data).toBe(null)
    expect(typeof result.current.openModal).toBe('function')
    expect(typeof result.current.closeModal).toBe('function')
  })

  // 前提：openModal関数がデータ付きで呼び出される
  // 期待値：isOpenがtrueになり、渡されたデータが設定される
  it('データ付きでモーダルを開ける', () => {
    const { result } = renderHook(() => useModal<{ id: number; name: string }>())
    const testData = { id: 1, name: 'テスト' }

    act(() => {
      result.current.openModal(testData)
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.data).toEqual(testData)
  })
})
```

### 4.4 client-page/action.ts

#### 4.4.1 テスト対象

**テストする内容**
- action.tsファイルに定義されたServer Action関数
- フォームデータの処理ロジック
- バリデーション処理（Zod）の動作確認
- ActionStateの状態管理
- Domain層（use-case）呼び出しの確認
- Next.js機能（revalidatePath）の呼び出し確認

**テスト対象外**
- コンポーネント内に直接書かれた関数
- UI表示やユーザー操作
- 実際のServer Action実行環境

#### 4.4.2 テスト例

```typescript
describe('createTodoAction', () => {
  const initialState: TodoFormActionState = {
    status: ACTION_STATUS.IDLE,
    error: null,
    validationErrors: null,
  }

  // 前提：有効なフォームデータが送信され、use-caseが成功する
  // 期待値：成功状態が返され、revalidatePathが呼ばれる
  it('有効なデータでTodo作成が成功する', async () => {
    const formData = createFormData({
      title: '新しいTodo',
      description: '新しい説明',
      completed: false,
    })

    vi.mocked(createTodo).mockResolvedValue(ok(mockTodoEntity))

    const result = await createTodoAction(initialState, formData)

    expect(result).toEqual({
      status: ACTION_STATUS.SUCCESS,
      error: null,
      validationErrors: null,
    })

    expect(createTodo).toHaveBeenCalledWith({
      title: '新しいTodo',
      description: '新しい説明',
      completed: false,
    })

    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  // 前提：titleが空のフォームデータが送信される
  // 期待値：バリデーションエラー状態が返され、入力値が保持される
  it('titleが空の場合バリデーションエラーが返される', async () => {
    const formData = createFormData({
      title: '',
      description: '説明',
      completed: false,
    })

    const result = await createTodoAction(initialState, formData)

    expect(result.status).toBe(ACTION_STATUS.VALIDATION_ERROR)
    expect(result.error).toBe('タイトルは必須です')
    expect(result.validationErrors?.title).toEqual(['タイトルは必須です'])

    expect(createTodo).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
```

## 5. モック戦略

### 5.1 core/ layer のモック

#### 5.1.1 外部SDKのモック

```typescript
// S3クライアントのモック
vi.mock('aws-sdk', () => ({
  S3: vi.fn(() => ({
    upload: vi.fn(),
    deleteObject: vi.fn(),
    getSignedUrl: vi.fn(),
  }))
}))

// Firebaseのモック
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}))
```

### 5.2 domain/ layer のモック

#### 5.2.1 Hono RPC クライアントのモック

```typescript
vi.mock('@/core/service/api.service', () => ({
  apiClient: {
    api: {
      todos: {
        $get: vi.fn(),
        $post: vi.fn(),
        ':todoId': {
          $get: vi.fn(),
          $put: vi.fn(),
          $delete: vi.fn(),
        },
      },
    },
  },
}))
```

#### 5.2.2 モックデータの設計

```typescript
// 基本的なTodoオブジェクト（API仕様に準拠）
const createMockTodoApiData = (overrides = {}) => ({
  id: 1,
  title: 'テストTodo',
  description: 'テストの説明',
  completed: false,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
})

// レスポンス全体のモック
const createMockTodoResponse = (todo = createMockTodoApiData()) => ({
  ok: true,
  json: vi.fn().mockResolvedValue({
    todo
  })
})
```

### 5.3 client-page/action.ts のモック

#### 5.3.1 外部依存のモック

```typescript
// Next.js revalidatePathをモック
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Domain layer use-casesをモック
vi.mock('@/domain/logic/action/todo/create-todo', () => ({
  createTodo: vi.fn(),
}))
```

#### 5.3.2 FormDataヘルパー

```typescript
// FormData作成ヘルパー
const createFormData = (data: Record<string, string | boolean>) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      formData.append(key, value ? 'on' : 'off')
    } else {
      formData.append(key, value)
    }
  })
  return formData
}
```

### 5.4 util/hook/ のモック

#### 5.4.1 React Testing Library

```typescript
import { renderHook, act } from '@testing-library/react'

// Context Providerが必要な場合
const createWrapper = () => ({ children }: PropsWithChildren) => 
  <ToastProvider>{children}</ToastProvider>

const { result } = renderHook(() => useToast(), { 
  wrapper: createWrapper() 
})
```

#### 5.4.2 外部フックのモック

```typescript
// useContextを使用するフックのモック
vi.mock('@/utils/hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
  })),
}))
```

## 6. テストケースの実装パターン

### 6.1 正常系テスト

- **基本的な成功ケース**: 標準的な入力での正常動作
- **境界値での成功ケース**: 最小/最大値など境界値での正常動作
- **条件分岐の確認**: if文やswitch文の各分岐パターン

### 6.2 異常系テスト

- **バリデーションエラー**: 必須フィールドの欠落、不正な値
- **外部エラー**: API通信エラー、ネットワークエラー
- **空データ**: 空配列、null、undefined等のエッジケース

## 7. テストファイルの配置

テストファイルは `src/__test__/` 配下にミラー構造で配置します：

```
src/
├── __test__/
│   ├── core/
│   │   └── service/
│   │       ├── api.service.test.ts
│   │       ├── s3.service.test.ts
│   │       └── firebase.service.test.ts
│   ├── domain/
│   │   ├── logic/
│   │   │   ├── ssr/
│   │   │   │   └── todo/
│   │   │   │       ├── fetch-todo.test.ts
│   │   │   │       └── fetch-todos.test.ts
│   │   │   └── action/
│   │   │       └── todo/
│   │   │           ├── create-todo.test.ts
│   │   │           ├── update-todo.test.ts
│   │   │           └── delete-todo.test.ts
│   │   └── util/
│   │       └── todo/
│   │           └── transform-to-todo-entity.test.ts
│   ├── util/
│   │   ├── date-format.test.ts
│   │   ├── server-actions.test.ts
│   │   └── hooks/
│   │       ├── useModal.test.ts
│   │       └── useToast.test.ts
│   └── component/
│       └── client-page/
│           └── todo/
│               └── action.test.ts
├── domain/
├── util/
└── component/
```

## 8. コメント規則

### 8.1 基本ルール

- テストケースの前に前提条件と期待値を日本語のコメントで記述する
- 各処理の前に何をするかを説明するコメントを記述する
- コメントは「だ・である」調で統一する
- コメントは必ず「。」で終わる完全な文章で記述する

### 8.2 テストケース前のコメント

```typescript
// 前提：有効なISO形式の日付文字列が渡される
// 期待値：日本語ロケールでフォーマットされた日付文字列が返される
it('有効なISO日付文字列が正しくフォーマットされる', () => {
  // テスト実装...
})
```

### 8.3 処理説明のコメント

```typescript
// APIクライアントをモック化
vi.mock('@/core/service/api.service', () => ({
  // モック実装...
}))

// テストデータを準備
const mockTodo = createMockTodoApiData()

// 関数を実行
const result = await fetchTodo(1)

// 結果を検証
expect(result.isOk()).toBe(true)
```

## 9. テスト実装チェックリスト

テスト実装時は以下の点を確認してください：

- [ ] 正常系のテストケースが実装されているか
- [ ] 基本的な異常系のテストケースが実装されているか
- [ ] 各テストケースに前提条件と期待値のコメントが記述されているか
- [ ] 外部依存が適切にモック化されているか
- [ ] モックデータが実際のAPI仕様に準拠しているか
- [ ] Result型のエラーハンドリングが検証されているか
- [ ] beforeEachでモックがクリアされているか
- [ ] テストファイルがミラー構造で配置されているか
- [ ] コメントが「だ・である」調で統一されているか
- [ ] コメントが「。」で終わる完全な文章になっているか

## 10. テストしない内容

以下の内容はテスト対象外とします：

### 10.1 コンポーネントテスト
- Reactコンポーネントのレンダリング
- UIの表示確認
- ユーザーインタラクション

### 10.2 型定義・定数
- TypeScriptの型定義
- 定数の値
- Enumの定義

### 10.3 外部ライブラリの動作
- Zodライブラリ自体の動作
- React Hooksの基本動作
- Next.jsの機能

### 10.4 設定ファイル
- APIクライアントの設定
- 環境変数の読み込み
- 単純な設定値の定義