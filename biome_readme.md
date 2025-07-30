# Biome Setup Guide

このプロジェクトでは、高速なJavaScript/TypeScript用リンター・フォーマッターの**Biome**を使用しています。

## 概要

BiomeはESLint + Prettierの代替となるオールインワンのツールです。
- 🚀 **高速**: RustベースでESLintより10-100倍高速
- ⚡ **統一**: リントとフォーマットを一つのツールで
- 🔧 **設定簡単**: 最小限の設定で開始可能

## インストール

```bash
# プロジェクトルートで実行
bun add --dev @biomejs/biome
```

## 設定ファイル

### biome.json
```json
{
  "$schema": "https://biomejs.dev/schemas/2.1.2/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded"
    }
  },
  "files": {
    "maxSize": 1048576
  }
}
```

### VSCode設定 (.vscode/settings.json)
```json
{
  "[typescript]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "biomejs.biome",
    "editor.codeActionsOnSave": {
      "source.addMissingImports.ts": "always",
      "source.removeUnusedImports": "always"
    }
  },
  "[javascript]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascriptreact]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

## 基本的な使い方

### コマンドライン

```bash
# フォーマット（コードの整形）
bunx biome format --write .

# リント（コードの問題をチェック・修正）
bunx biome lint --write .

# フォーマット + リントを同時実行（推奨）
bunx biome check --write .

# チェックのみ（変更はしない）
bunx biome check .
```

### Bun Workspaceでの使用

```bash
# 全ワークスペースを対象
bunx biome check --write .

# 特定のワークスペースのみ
bunx biome check --write packages/frontend
bunx biome check --write packages/backend

# 複数のワークスペースを指定
bunx biome check --write packages/frontend packages/backend
```

## package.json スクリプト

各ワークスペースまたはルートの`package.json`に以下を追加：

```json
{
  "scripts": {
    "format": "biome format --write .",
    "lint": "biome lint --write .",
    "check": "biome check --write .",
    "check:ci": "biome check ."
  }
}
```

### 実行例

```bash
# ルートから全体をチェック
bun run check

# 特定のワークスペースでスクリプト実行
bun --filter frontend check
bun --filter backend lint

# 全ワークスペースで実行
bun --filter '*' check
```

## VSCode拡張機能

1. VSCodeで「**Biome**」拡張機能をインストール
2. 上記のVSCode設定を適用
3. ファイル保存時に自動でフォーマット・リントが実行されます

## よくある使用パターン

### 開発中
```bash
# コードを書いた後に実行
bun run check
```

### コミット前
```bash
# 全ての問題を修正してからコミット
bunx biome check --write .
```

### CI/CD
```bash
# チェックのみ（修正はしない）
bunx biome check .
```

## 設定の詳細

### フォーマッター設定
- **indentStyle**: `space` (2スペース)
- **lineWidth**: 100文字で改行
- **quoteStyle**: シングルクォート使用
- **semicolons**: `asNeeded` (必要な場合のみセミコロン)

### リンター設定
- **recommended**: 推奨ルールセットを使用
- 型のみのインポートは`import type`を使用するよう自動修正
- 未使用変数の検出
- コードの複雑性チェック

## トラブルシューティング

### 設定ファイルのバージョン不一致
```bash
bunx biome migrate --write
```

### 生成されたファイル（Prismaなど）を除外したい場合
`.gitignore`に追加するか、コマンドで特定のディレクトリのみ指定：
```bash
bunx biome check --write packages/frontend packages/backend
```

### 大量のエラーが出る場合
```bash
# エラー数を制限して表示
bunx biome check --max-diagnostics=50 .
```

## 移行ガイド

### ESLint + Prettierから移行する場合

1. 既存の設定ファイルを削除または無効化
   - `.eslintrc.*`
   - `.prettierrc.*`
   - `.prettierignore`

2. package.jsonから関連パッケージを削除
```bash
bun remove eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

3. VSCode設定を更新（上記の設定を適用）

4. 全ファイルをBiomeでフォーマット
```bash
bunx biome check --write .
```

## 参考リンク

- [Biome公式ドキュメント](https://biomejs.dev/)
- [設定オプション一覧](https://biomejs.dev/reference/configuration/)
- [VSCode拡張機能](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)