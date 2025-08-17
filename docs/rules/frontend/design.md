# デザインシステム実装ルール

## 概要

デザインシステムは、一貫性のある UI を実現するための基盤です。
CSS カスタムプロパティを使用して、色、タイポグラフィ、スペーシングなどのデザイントークンを定義します。

## 基本方針

1. CSS カスタムプロパティの使用
2. Tailwind CSS との連携
3. アクセシビリティへの配慮
4. レスポンシブデザイン

## カラーシステム

### 1. プライマリカラー

```css
:root {
  /* プライマリ */
  --color-primary: #2563eb;
  --color-primary-dark: #1d4ed8;
  --color-primary-light: #3b82f6;

  /* グレースケール */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* セマンティック */
  --color-background: var(--color-gray-50);
  --color-foreground: var(--color-gray-900);
  --color-error: #dc2626;
  --color-error-dark: #b91c1c;
  --color-success: #16a34a;
  --color-success-dark: #15803d;
  --color-warning: #ca8a04;
  --color-warning-dark: #a16207;
}
```

### 2. ダークモード

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: var(--color-gray-900);
    --color-foreground: var(--color-gray-50);
  }
}
```

## タイポグラフィ

```css
:root {
  /* フォントファミリー */
  --font-sans: ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, monospace;

  /* フォントサイズ */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  /* 行の高さ */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  --leading-loose: 2;
}
```

## スペーシング

```css
:root {
  /* スペーシング */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
}
```

## コンポーネントスタイル

### 1. ボタン

```css
@layer components {
  .btn {
    @apply inline-flex items-center justify-center;
    @apply px-4 py-2;
    @apply font-medium rounded-lg;
    @apply transition-colors;
  }

  .btn-primary {
    @apply bg-primary text-white;
    @apply hover:bg-primary-dark;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-secondary {
    @apply bg-gray-500 text-white;
    @apply hover:bg-gray-600;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-danger {
    @apply bg-error text-white;
    @apply hover:bg-error-dark;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }
}
```

### 2. フォーム要素

```css
@layer components {
  .input {
    @apply w-full p-2;
    @apply border border-gray-500 rounded-lg;
    @apply bg-background text-foreground;
    @apply focus:outline-none focus:ring-2 focus:ring-primary;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .input-error {
    @apply border-error;
    @apply focus:ring-error;
  }

  .label {
    @apply block text-sm font-medium text-foreground;
    @apply mb-1;
  }

  .error-message {
    @apply text-sm text-error;
    @apply mt-1;
  }
}
```

### 3. カード

```css
@layer components {
  .card {
    @apply bg-background;
    @apply rounded-lg shadow-md;
    @apply p-6;
  }

  .card-header {
    @apply text-xl font-bold text-foreground;
    @apply mb-4;
  }

  .card-body {
    @apply text-base text-foreground;
  }

  .card-footer {
    @apply mt-4;
    @apply flex justify-end gap-2;
  }
}
```

## レスポンシブデザイン

```css
@layer utilities {
  /* モバイルファースト */
  .container {
    @apply mx-auto px-4;
    @apply sm:px-6 lg:px-8;
    @apply max-w-7xl;
  }

  /* グリッドシステム */
  .grid-cols-auto-fit {
    @apply grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    @apply gap-4;
  }
}
```

## チェックリスト

### カラー

- [ ] プライマリカラーが定義されている
- [ ] グレースケールが定義されている
- [ ] セマンティックカラーが定義されている
- [ ] ダークモード対応が実装されている

### タイポグラフィ

- [ ] フォントファミリーが定義されている
- [ ] フォントサイズが定義されている
- [ ] 行の高さが定義されている
- [ ] フォントウェイトが定義されている

### スペーシング

- [ ] 基本単位が定義されている
- [ ] 一貫性のある間隔が設定されている
- [ ] レスポンシブ対応が考慮されている
- [ ] コンポーネント間の余白が統一されている

### コンポーネント

- [ ] 基本スタイルが定義されている
- [ ] バリアントが実装されている
- [ ] 状態変化が考慮されている
- [ ] アクセシビリティに配慮している

### レスポンシブ

- [ ] ブレイクポイントが定義されている
- [ ] モバイルファーストで実装されている
- [ ] グリッドシステムが実装されている
- [ ] コンテナサイズが適切に設定されている
