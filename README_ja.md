# Playwright Evidence Tool

[English](./README.md)

このツールは、ディレクトリ内のすべてのHTMLファイルに対して、複数のデバイスレイアウト（PC、タブレット、モバイル）での**フルページスクリーンショット**を自動的に撮影します。

## 1. インストール

以下のコマンドを実行して、必要なパッケージとブラウザをインストールしてください。

```bash
# 依存パッケージのインストール
npm install

# Playwrightブラウザのインストール
npx playwright install chromium
```

## 2. 使い方

### 基本的なコマンド

スクリプトには、引数として対象ディレクトリを指定する必要があります。

```bash
# 'npx ts-node' で実行
npx ts-node capture-all.ts ./path/to/your/html/files
```

例:
```bash
npx ts-node capture-all.ts ./dist
```

### 出力

スクリーンショットはプロジェクトルートの `verification` ディレクトリに保存されます。
対象のディレクトリ構造は保持されます。

例:
対象が `./dist` の場合:
- `./dist/index.html` -> `./verification/iPhone16_index.png`
- `./dist/about/company.html` -> `./verification/about/iPhone16_company.png`

### 対象ディレクトリの変更

コマンドに渡す引数を変更するだけです。

```bash
# 'src' ディレクトリを対象にする場合
npx ts-node capture-all.ts ./src

# 'public' ディレクトリを対象にする場合
npx ts-node capture-all.ts ./public
```

### サンプルデータでの実行

このリポジトリには、デモ用のサンプルターゲットディレクトリ（`sample-target`）とその出力結果（`verification`）が含まれています。

```bash
# サンプルに対して実行
npx ts-node capture-all.ts sample-target
```

`verification` フォルダを確認して結果をご覧ください。

## 3. 機能

- **再帰的検索**: 対象ディレクトリおよびサブディレクトリ内のすべての `.html` ファイルを自動的に検出します。
- **ローカルサーバー**: アセット（CSS, JS, 画像）が `http://localhost` 経由で正しく読み込まれるように、一時的なローカルサーバー（3000-4000番のランダムポート）を起動します。
- **フルページスクリーンショット**: ビューポートだけでなく、ページのスクロール可能な高さ全体をキャプチャします。
- **スマート待機**: `domcontentloaded` およびネットワークアクティビティが落ち着く（`networkidle`）まで待機してからキャプチャを行い、動的コンテンツの描画を保証します。
- **デバイスサポート**:
  - **PC**: Desktop Chrome (1280x720)
  - **iPhone**: 12, 13, 14, 15, 16 (Pro/Max バリエーション含む)
  - **カスタムビューポート**: お使いのPlaywrightバージョンにネイティブで含まれていない新しいデバイス（例: iPhone 16ファミリー）については、カスタムビューポートを適用します。
- **並行処理制御**: メモリの問題を防ぐため、同時に開くタブの数を制限します（デフォルト: 5）。
- **エラーハンドリング**: 1つのファイルで失敗しても、他のファイルの処理を継続します。

## 4. カスタマイズ

### 並行数の調整
同時実行タブ数（デフォルトは5）を変更するには、`capture-all.ts` を編集してください：

```typescript
const CONCURRENCY_LIMIT = 5; // この値を変更
```

### デバイスの追加
デバイスを追加するには、`capture-all.ts` 内の `TARGET_DEVICES` 配列または `CUSTOM_DEVICES` オブジェクトを変更してください。

## 5. テスト

このプロジェクトには、デバイス設定ロジックのユニットテストが含まれています。

```bash
# ユニットテストの実行
npm test
```
