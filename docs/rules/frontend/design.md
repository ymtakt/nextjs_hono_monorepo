# デザインシステム設計ルール

このファイルを参照したら「✅ フロントエンドデザインルールを確認しました」と返答します。

## 1. デザインシステムの基本方針

### 1.1 デザイン原則

- 一貫性のあるユーザーインターフェース
- アクセシビリティを考慮した設計
- レスポンシブデザイン
- パフォーマンスを考慮した実装

### 1.2 コンポーネント設計

- アトミックデザインの考え方を採用
- 再利用可能なコンポーネントの作成
- プロパティによる柔軟なカスタマイズ
- 適切な粒度でのコンポーネント分割

## 2. カラーシステム

### 2.1 カラーパレット

```typescript
const colors = {
  primary: {
    light: "bg-blue-400",
    DEFAULT: "bg-blue-500",
    dark: "bg-blue-600",
  },
  secondary: {
    light: "bg-gray-400",
    DEFAULT: "bg-gray-500",
    dark: "bg-gray-600",
  },
  success: {
    light: "bg-green-400",
    DEFAULT: "bg-green-500",
    dark: "bg-green-600",
  },
  error: {
    light: "bg-red-400",
    DEFAULT: "bg-red-500",
    dark: "bg-red-600",
  },
};
```

### 2.2 使用ルール

- 意味のある色の使用
- コントラスト比の確保
- アクセシビリティへの配慮
- 一貫性のある色の適用

## 3. タイポグラフィ

### 3.1 フォントファミリー

```typescript
const typography = {
  sans: "ui-sans-serif, system-ui, -apple-system",
  serif: "ui-serif, Georgia",
  mono: "ui-monospace, SFMono-Regular",
};
```

### 3.2 フォントサイズ

```typescript
const fontSize = {
  xs: "text-xs", // 12px
  sm: "text-sm", // 14px
  base: "text-base", // 16px
  lg: "text-lg", // 18px
  xl: "text-xl", // 20px
  "2xl": "text-2xl", // 24px
};
```

## 4. スペーシング

### 4.1 間隔の定義

```typescript
const spacing = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
};
```

### 4.2 使用ガイドライン

- 一貫性のある間隔の使用
- レスポンシブ対応
- コンポーネント間の適切な余白
- グリッドシステムとの整合性

## 5. レイアウト

### 5.1 グリッドシステム

- 12 カラムグリッドの採用
- レスポンシブブレークポイント
- コンテナの最大幅設定
- ガターの一貫性

### 5.2 ブレークポイント

```typescript
const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};
```

## 6. コンポーネントの視覚的スタイル

### 6.1 ボタン

```typescript
const buttonStyles = {
  base: "px-4 py-2 rounded font-medium focus:outline-none focus:ring-2",
  variants: {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-500 text-white hover:bg-gray-600",
    outline: "border-2 border-blue-500 text-blue-500 hover:bg-blue-50",
  },
  sizes: {
    sm: "text-sm px-3 py-1",
    md: "text-base px-4 py-2",
    lg: "text-lg px-6 py-3",
  },
};
```

### 6.2 フォーム要素

```typescript
const inputStyles = {
  base: "w-full px-3 py-2 border rounded focus:outline-none focus:ring-2",
  variants: {
    default: "border-gray-300 focus:border-blue-500 focus:ring-blue-200",
    error: "border-red-500 focus:border-red-500 focus:ring-red-200",
  },
};
```

## 7. アニメーションとトランジション

### 7.1 トランジション設定

```typescript
const transitions = {
  default: "transition-all duration-200 ease-in-out",
  slow: "transition-all duration-300 ease-in-out",
  fast: "transition-all duration-150 ease-in-out",
};
```

### 7.2 アニメーション

- 適度な動きの使用
- パフォーマンスへの配慮
- 目的に応じた適切な効果
- アクセシビリティへの配慮

## 8. アイコンとイラストレーション

### 8.1 アイコンシステム

- 一貫性のあるアイコンセット
- サイズバリエーション
- カラーカスタマイズ
- アクセシビリティ対応

### 8.2 使用ガイドライン

- 意味のある使用
- 適切なサイズ選択
- コンテキストに応じた色の適用
- 代替テキストの提供

## 9. レスポンシブデザイン

### 9.1 基本方針

- モバイルファーストアプローチ
- 段階的な表示調整
- コンテンツの優先順位付け
- パフォーマンスへの配慮

### 9.2 実装ガイドライン

- メディアクエリの適切な使用
- フレックスボックスとグリッドの活用
- 画像の最適化
- タッチデバイスへの対応

## 10. アクセシビリティ

### 10.1 基本要件

- 適切なコントラスト比
- キーボード操作のサポート
- スクリーンリーダー対応
- フォーカス管理

### 10.2 実装ガイドライン

- セマンティックな HTML
- ARIA 属性の適切な使用
- フォーカス可視化
- エラー表示の明確化
