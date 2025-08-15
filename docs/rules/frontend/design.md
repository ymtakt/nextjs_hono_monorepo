# デザインシステムルール

このファイルを参照したら「✅ デザインシステムルールを確認しました」と返答します。

## 1. 基本方針

本プロジェクトでは、一貫したデザインと保守性の高い UI を実現するため、以下の方針に従います：

- **事前定義スタイル**: カラー、タイポグラフィー、アイコン、余白を統一
- **コンポーネント再利用**: UI 部品は必ず共通コンポーネントを使用
- **CSS 変数 + Tailwind**: `globals.css`でデザイントークンを定義し、Tailwind で適用

## 2. カラーシステム

### 2.1 カラー定義

すべての色は `src/app/globals.css` で CSS 変数として定義し、Tailwind のカスタムクラスで使用します。

```css
/* src/app/globals.css */
:root {
  /* Primary Colors */
  --color-primary-50: #fefce8;
  --color-primary-100: #fef3c7;
  --color-primary-500: #ffd700;
  --color-primary-600: #e6c200;
  --color-primary-900: #713f12;

  /* Gray Colors */
  --color-gray-50: #fafaf9;
  --color-gray-100: #f5f5f4;
  --color-gray-500: #71717a;
  --color-gray-800: #27272a;
  --color-gray-900: #18181b;

  /* Semantic Colors */
  --color-background: #fffffe;
  --color-foreground: #18181b;
  --color-success: #16a34a;
  --color-error: #dc2626;
  --color-warning: #ea580c;
}

/* Tailwind Custom Classes */
.text-primary {
  color: var(--color-primary-500);
}
.text-primary-600 {
  color: var(--color-primary-600);
}
.text-foreground {
  color: var(--color-foreground);
}
.text-gray-500 {
  color: var(--color-gray-500);
}
.text-success {
  color: var(--color-success);
}
.text-error {
  color: var(--color-error);
}

.bg-primary {
  background-color: var(--color-primary-500);
}
.bg-primary-50 {
  background-color: var(--color-primary-50);
}
.bg-background {
  background-color: var(--color-background);
}
.bg-gray-100 {
  background-color: var(--color-gray-100);
}

.border-primary {
  border-color: var(--color-primary-500);
}
.border-gray-500 {
  border-color: var(--color-gray-500);
}
```

### 2.2 カラー使用ルール

```tsx
// ✅ 良い例：定義済みクラスを使用
<div className="text-foreground bg-background">
<button className="bg-primary text-white">
<p className="text-gray-500">

// ❌ 悪い例：ハードコードした色
<div className="text-[#18181b] bg-[#fffffe]">
<button className="bg-[#ffd700]">
<p style={{color: '#71717a'}}>
```

## 3. タイポグラフィーシステム

### 3.1 フォントサイズ定義

```css
/* src/app/globals.css */
.text-xs {
  font-size: 12px;
  line-height: 16px;
}
.text-sm {
  font-size: 14px;
  line-height: 20px;
}
.text-base {
  font-size: 16px;
  line-height: 24px;
}
.text-lg {
  font-size: 18px;
  line-height: 28px;
}
.text-xl {
  font-size: 20px;
  line-height: 28px;
}
.text-2xl {
  font-size: 24px;
  line-height: 32px;
}
.text-3xl {
  font-size: 30px;
  line-height: 36px;
}

/* フォントウェイト */
.font-normal {
  font-weight: 400;
}
.font-medium {
  font-weight: 500;
}
.font-semibold {
  font-weight: 600;
}
.font-bold {
  font-weight: 700;
}
```

### 3.2 タイポグラフィー使用ルール

```tsx
// ✅ 良い例：定義済みクラスを使用
<h1 className="text-3xl font-bold text-foreground">
<p className="text-base text-gray-500">
<span className="text-sm font-medium">

// ❌ 悪い例：カスタムサイズ
<h1 className="text-[32px]">
<p style={{fontSize: '15px'}}>
```

## 4. アイコンシステム

### 4.1 アイコンライブラリ

統一されたアイコンセットとして **Lucide React** を使用します。

```tsx
import { Search, User, Settings, ChevronDown, Plus } from 'lucide-react'

// ✅ 良い例：統一されたアイコン
<Search className="w-5 h-5 text-gray-500" />
<User className="w-6 h-6 text-foreground" />

// ❌ 悪い例：複数のアイコンライブラリ混在
import { FaSearch } from 'react-icons/fa'  // React Icons
import SearchIcon from '@mui/icons-material/Search'  // Material UI
```

### 4.2 アイコンサイズ

```css
/* 標準アイコンサイズ */
.icon-xs {
  width: 12px;
  height: 12px;
} /* w-3 h-3 */
.icon-sm {
  width: 16px;
  height: 16px;
} /* w-4 h-4 */
.icon-base {
  width: 20px;
  height: 20px;
} /* w-5 h-5 */
.icon-lg {
  width: 24px;
  height: 24px;
} /* w-6 h-6 */
.icon-xl {
  width: 32px;
  height: 32px;
} /* w-8 h-8 */
```

## 5. 余白システム

### 5.1 余白ルール

**4 の倍数**を基本とし、**8 の倍数**を推奨します。

```tsx
// ✅ 良い例：4,8の倍数
<div className="p-4 m-8">        // 16px, 32px
<div className="px-6 py-3">      // 24px, 12px
<div className="space-y-4">      // 16px間隔
<div className="gap-2">          // 8px間隔

// ❌ 悪い例：中途半端な値
<div className="p-5 m-7">        // 20px, 28px
<div className="space-y-3">      // 12px間隔
```

### 5.2 余白パターン

```css
/* 推奨余白値 */
.p-1 {
  padding: 4px;
} /* 使用頻度：低 */
.p-2 {
  padding: 8px;
} /* 使用頻度：中 */
.p-3 {
  padding: 12px;
} /* 使用頻度：中 */
.p-4 {
  padding: 16px;
} /* 使用頻度：高 */
.p-6 {
  padding: 24px;
} /* 使用頻度：高 */
.p-8 {
  padding: 32px;
} /* 使用頻度：高 */
.p-12 {
  padding: 48px;
} /* 使用頻度：中 */
```

## 6. コンポーネントシステム

### 6.1 UI コンポーネントの使用

すべての UI 部品は `src/component/functionless` 配下の共通コンポーネントを使用してください。

#### 6.1.1 ボタン・リンク系

```tsx
// src/component/functionless/Button.tsx
import { Button } from '@/component/functionless/Button'
import { TextLink } from '@/component/functionless/TextLink'
import { Pagination } from '@/component/functionless/Pagination'

// ✅ 良い例：共通コンポーネントを使用
<Button variant="primary" size="lg">保存</Button>
<TextLink href="/about">詳細を見る</TextLink>
<Pagination currentPage={1} totalPages={10} />

// ❌ 悪い例：独自のボタンを作成
<button className="bg-primary text-white px-4 py-2 rounded">
```

#### 6.1.2 フォーム系

```tsx
// src/component/functionless/form/
import { Input } from '@/component/functionless/form/Input'
import { Select } from '@/component/functionless/form/Select'
import { Checkbox } from '@/component/functionless/form/Checkbox'

// ✅ 良い例：共通フォーム部品を使用
<Input type="email" placeholder="メールアドレス" />
<Select options={options} placeholder="選択してください" />
<Checkbox label="利用規約に同意する" />

// ❌ 悪い例：独自のinputを作成
<input className="border border-gray-300 px-3 py-2 rounded" />
```

### 6.2 コンポーネント作成ルール

新しいコンポーネントを作成する場合：

1. **既存コンポーネントで対応可能か確認**
2. **functionless 配下に配置**（副作用なしの純粋コンポーネント）
3. **定義済みスタイルのみ使用**
4. **Props で柔軟性を提供**

```tsx
// ✅ 良い例：再利用可能なコンポーネント
interface CardProps {
  variant?: "default" | "outlined";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Card = ({
  variant = "default",
  size = "md",
  children,
}: CardProps) => {
  return (
    <div
      className={`
      bg-background border-gray-500 rounded-lg
      ${variant === "outlined" ? "border" : "shadow-md"}
      ${size === "sm" ? "p-4" : size === "lg" ? "p-8" : "p-6"}
    `}
    >
      {children}
    </div>
  );
};
```

## 7. 実装チェックリスト

### 7.1 スタイリング実装時

- [ ] カラーは定義済みクラスを使用しているか
- [ ] フォントサイズは定義済みサイズを使用しているか
- [ ] 余白は 4,8 の倍数を使用しているか
- [ ] アイコンは Lucide React を使用しているか
- [ ] UI 部品は共通コンポーネントを使用しているか

### 7.2 コンポーネント作成時

- [ ] 既存コンポーネントで対応できないか確認したか
- [ ] functionless 配下に配置したか
- [ ] ハードコードした色・サイズを使用していないか
- [ ] 再利用可能な設計になっているか
- [ ] Props で柔軟性を提供しているか

## 8. 禁止事項

### 8.1 絶対に避けるべき実装

```tsx
// ❌ ハードコードした色
<div className="text-[#333333] bg-[#FFFFFF]">

// ❌ インラインスタイル
<p style={{color: '#666', fontSize: '15px'}}>

// ❌ 独自のボタン作成
<button className="px-4 py-2 bg-blue-500 text-white rounded">

// ❌ 4,8の倍数以外の余白
<div className="p-5 m-7 space-y-3">

// ❌ 複数のアイコンライブラリ混在
import { FaHome } from 'react-icons/fa'
import HomeIcon from '@heroicons/react/outline/HomeIcon'
```

## 9. テーマ変更への対応

CSS 変数を使用することで、テーマ変更時は `globals.css` の変数値のみ変更すれば全体に反映されます。

```css
/* ダークテーマ例 */
[data-theme="dark"] {
  --color-background: #18181b;
  --color-foreground: #fafaf9;
  --color-primary-500: #fbbf24;
}
```

この設計により、**保守性が高く**、**一貫したデザイン**、**テーマ変更に強い**UI システムを実現できます。
