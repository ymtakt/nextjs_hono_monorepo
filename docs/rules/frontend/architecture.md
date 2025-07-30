# フロントエンドアーキテクチャ

## 概要

Next.js を使用したフロントエンドアプリケーションのアーキテクチャ概要について説明します。

## ディレクトリ構造

```
src/
├── app/             # Nextjs App Router pages
├── components/      # Reactコンポーネント
│   ├── functional/  # ビジネスロジックを含むコンポーネント
│   └── functionless/# 純粋な表示用コンポーネント
├── core/           # コアロジック
│   └── services/   # APIとの通信を担当するサービス
├── logic/          # ビジネスロジック
│   ├── data/      # データ型定義
│   ├── hooks/     # カスタムフック
│   └── use-case/  # ユースケース実装
└── utils/         # ユーティリティ関数
```

## レイヤー構造

1. プレゼンテーション層 (components/)
2. アプリケーション層 (logic/use-case/)
3. ドメイン層 (logic/data/)
4. インフラストラクチャ層 (core/services/)
