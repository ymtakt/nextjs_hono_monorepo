# CI/CD セットアップガイド

このプロジェクトでは、**Husky + lint-staged** でローカルのフォーマット・リントチェックを行い、**GitLab CI** で MR に対するテスト・カバレッジ検証を実行します。

## 🔧 ローカル開発環境（Husky + lint-staged）

### 自動セットアップ

```bash
# 依存関係のインストール（初回のみ）
bun install

# Huskyの初期化（自動実行）
bun run prepare
```

### 動作確認

```bash
# テストコミット（pre-commitフックが動作するか確認）
git add .
git commit -m "test: check husky setup"
```

### 処理内容

- **pre-commit 時**: 変更されたファイルに対してのみ format + lint を実行
- **frontend**: `typescript/frontend/**/*.{ts,tsx,js,jsx}`
- **backend**: `typescript/backend/**/*.{ts,js}`
- **root**: `*.{ts,tsx,js,jsx}`

## 🚀 GitLab CI/CD（MR 時のテスト・カバレッジ検証）

### パイプライン構成

#### 1. **Lint Stage**

```yaml
lint:check:
  - Biome CI チェック（全体）
  - 高速実行（1-2分）
```

#### 2. **Test Stage**（並列実行）

```yaml
test:frontend:
  - Vitestでフロントエンドテスト実行
  - カバレッジ閾値: 80%
  - Cobertura形式でレポート出力

test:backend:
  - PostgreSQL環境でバックエンドテスト実行
  - Prisma generate + テスト実行
  - カバレッジ閾値: 85%
  - Cobertura形式でレポート出力
```

#### 3. **Coverage Report Stage**

```yaml
coverage:validation:
  - 両方のカバレッジ閾値チェック
  - 失敗時はMRブロック
```

### 実行タイミング

- **Merge Request 作成時**
- **MR へのプッシュ時**
- **main ブランチへのプッシュ時**

## 📊 カバレッジ閾値

### Frontend

- **閾値**: 80%（lines, functions, branches, statements）
- **対象**:
  - `src/component/client-page/**/action.{ts,tsx}`
  - `src/core/**/*.{ts,tsx}`
  - `src/domain/logic/**/*.{ts,tsx}`
  - `src/util/**/*.{ts,tsx}`

### Backend

- **閾値**: 85%（lines, functions, branches, statements）
- **対象**:
  - `src/endpoint/handler/**/*.ts`

## 🛠️ トラブルシューティング

### Husky が動作しない

```bash
# Huskyを再インストール
rm -rf .husky
bun run prepare
chmod +x .husky/pre-commit
```

### GitLab CI でテストが失敗する

#### Frontend

```bash
# ローカルでテスト実行
cd typescript/frontend
bun run test:coverage
```

#### Backend

```bash
# ローカルでテスト実行（Dockerが必要）
cd typescript/backend
docker-compose -f compose.test.yml up -d
bun run db:generate
bun run test:coverage
docker-compose -f compose.test.yml down
```

### カバレッジ閾値を調整したい

- **Frontend**: `typescript/frontend/vitest.config.ts`
- **Backend**: `typescript/backend/vitest.config.ts`

```typescript
thresholds: {
  global: {
    branches: 80, // ここを調整
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

## 📝 開発フロー

1. **ローカル開発**

   ```bash
   # 開発
   git add .
   git commit -m "feat: add new feature"  # pre-commitでformat+lint
   git push origin feature-branch
   ```

2. **MR 作成**

   - GitLab 上で MR 作成
   - 自動的に CI/CD パイプラインが実行
   - テスト・カバレッジ検証が完了するまで待機

3. **マージ**
   - すべてのチェックが ✅ になったらマージ可能
   - カバレッジ閾値未達の場合はマージブロック

## 🎯 メリット

### 開発者体験

- **高速**: ローカルチェックは数秒で完了
- **確実**: CI 環境で本格的なテスト実行
- **可視化**: GitLab の UI 上でカバレッジ確認可能

### 品質保証

- **早期発見**: コミット時に format/lint エラーを検出
- **網羅的**: CI 環境でのテスト実行により品質担保
- **自動化**: 人的ミスを防ぐ自動チェック
