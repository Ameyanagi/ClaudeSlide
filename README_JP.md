# ClaudeSlide

**Claude Opus 4.5のXML理解力を活かしたパワポ編集ツール**

[English](./README.md) | 日本語

## はじめに

2025年11月、GoogleがGemini 3.0と画像生成モデル「[Nano Banana Pro](https://gemini.google/jp/overview/image-generation/)」をリリースし、AIによるスライド生成が大きな話題になっています。

Nano BananaでSVGを作成し、それをパワーポイントに貼り付けて図形として貼り付けることでスライドを生成する方法が昨今X（旧Twitter）などで多く紹介されています。

確かに革新的なアプローチですが、私はこれがベストな解決策だとは思いませんでした。

**なぜなら：**

- **既存のテンプレートが使えない** - 企業には長年使ってきたブランドガイドラインに沿ったテンプレートがある
- **変換時に情報が失われる** - スライドマスター、アニメーション、ノートなどが失われる
- **部分的な修正が困難** - 「3枚目のタイトルだけ変えたい」といった細かい編集ができない
- **バージョン管理ができない** - 変更履歴を追跡できない

私が作りたかったのは、**既存のパワポをそのまま編集できる**ツールでした。

## Claude Opus 4.5のXML理解力

ここで注目したのが、Claude Opus 4.5の能力です。

PowerPointファイル（.pptx）は、実はZIPアーカイブされたXMLファイルの集合体です。Office Open XML（OOXML）という規格で、スライドの内容、レイアウト、テーマ、画像への参照などがすべてXMLで記述されています。

Claude Opus 4.5は：

- **構造化されたXMLを正確に理解できる**
- **スキーマに準拠したXMLを低エラーで生成できる**
- **複雑な名前空間を持つXMLも適切に扱える**

この能力を最大限に活用すれば、パワポを直接編集できるはずだと考えました。

## ClaudeSlideとは

ClaudeSlideは、PowerPointファイルをClaude Codeで編集するためのCLIツールです。

```bash
npx claudeslide init presentation.pptx --name my-project
```

このコマンドで：

1. PPTXファイルをXMLに展開
2. Claude Code用のコンテキスト（CLAUDE.md）を生成
3. OOXMLのリファレンスドキュメントを配置
4. Gitリポジトリを初期化

あとはClaude Codeを起動して、自然言語で指示するだけです。

## 企業テンプレートをそのまま活用

**これが最大のメリットです。**

多くの企業には：

- ブランドカラーが定義されたテーマ
- ロゴが配置されたマスタースライド
- 承認済みのフォント設定
- 統一されたレイアウトテンプレート

これらがすべて保持されます。ClaudeSlideは既存のPPTXを展開するだけなので、テンプレートの情報はそのままXMLに含まれています。

### 実際のワークフロー

```bash
# 1. 企業テンプレートから初期化
npx claudeslide init corporate-template.pptx --name q4-report
cd q4-report

# 2. Claude Codeで編集開始
claude
# または権限確認をスキップする場合
# claude --dangerously-skip-permissions
```

Claude Codeに対して：

```
スライド1のタイトルを「2024年Q4業績報告」に変更してください。
スライド2に以下の売上データを箇条書きで追加してください：
- 売上高: 150億円（前年比+12%）
- 営業利益: 20億円（前年比+8%）
- 新規顧客数: 1,200社
```

Claudeは：

1. 該当するXMLファイルを読み込み
2. 適切な箇所を特定
3. XMLを編集
4. バリデーションを実行
5. プレビューを生成して確認
6. PPTXとして保存

すべて自動で行います。

## Gemini 3.0 / Nano Banana Proとの比較

| 観点 | Gemini 3.0 + Nano Banana Pro | ClaudeSlide |
|------|------------------------------|-------------|
| 既存テンプレート | ❌ 使用不可（ゼロから生成） | ✅ そのまま活用 |
| ブランドガイドライン | ❌ 再現が必要 | ✅ 維持される |
| スライドマスター | ❌ 失われる | ✅ 維持される |
| アニメーション | ❌ 非対応 | ✅ 編集可能 |
| スピーカーノート | ❌ 非対応 | ✅ 編集可能 |
| 部分的な修正 | ❌ 困難 | ✅ 容易 |
| バージョン管理 | ❌ 困難 | ✅ Git対応 |
| 生成速度 | ✅ 高速 | △ 編集ベース |
| ゼロからの作成 | ✅ 得意 | △ テンプレート推奨 |

**使い分けの提案：**

- **新規でカジュアルな資料** → Gemini 3.0 / Nano Banana Pro
- **既存テンプレートの編集・企業資料** → ClaudeSlide

## インストールと使い方

### インストール

```bash
npm install -g claudeslide
```

### 基本的な使い方

```bash
# プロジェクト初期化
claudeslide init presentation.pptx --name my-project
cd my-project

# Claude Codeで編集
claude

# 変更をバリデート
npm run validate

# プレビュー生成（LibreOffice必要）
npm run preview

# PPTXとして保存
npm run save
```

### プロジェクト構造

```
my-project/
├── CLAUDE.md                 # Claudeへの指示とスライド概要
├── source.pptx               # オリジナルのバックアップ
├── .claude/
│   ├── commands/             # スラッシュコマンド
│   └── skills/pptx/          # OOXMLリファレンス
└── work/                     # 展開されたXMLファイル
    ├── [Content_Types].xml
    └── ppt/
        ├── slides/           # スライド本体
        ├── slideLayouts/     # レイアウト
        ├── slideMasters/     # マスタースライド
        ├── theme/            # テーマ（色・フォント）
        └── media/            # 画像・メディア
```

## 実践例

### 例1: テキストの一括置換

```
すべてのスライドで「2024年」を「2025年」に置換してください
```

### 例2: 新しいスライドの追加

```
スライド3の後に新しいスライドを追加してください。
既存のスライドレイアウトを使用し、タイトルは「市場分析」で、
以下の内容を含めてください：
- 市場規模の推移
- 競合他社との比較
- 今後の成長予測
```

### 例3: デザインの調整

```
すべての見出しのフォントサイズを32ptに統一してください。
また、アクセントカラーを企業カラーの#1a73e8に変更してください。
```

### 例4: SVG図表の生成

```
スライド5にSVGで円グラフを作成してください：
- 国内売上: 60%
- 海外売上: 40%
テーマカラーを使用してください。
```

### 例5: プレゼン全体の要約

```
このプレゼンテーションを10枚以内に要約してください。
重複する内容は統合し、重要なポイントを残してください。
```

## Claudeの自律的な編集

CLAUDE.mdには以下の権限が記載されています：

> **編集権限**
>
> ユーザーのリクエストを完了するために必要な変更を自由に行えます：
> - スライドの追加・削除
> - 構造の変更（並べ替え、統合、分割）
> - コンテンツの修正

Claudeは自分の判断でスライドを削除・統合し、最適な構成を提案します。

## 品質保証ワークフロー

ClaudeSlideは、最終成果物を返す前に以下のワークフローを実行します：

1. **バリデーション** - XMLの構文チェック
2. **プレビュー生成** - PNGで視覚的に確認
3. **レビュー** - 問題があれば修正
4. **保存** - PPTXファイルを生成
5. **報告** - ユーザーに完了を通知

これにより、壊れたPPTXが生成されるリスクを最小化しています。

## 必要な環境

- **Node.js** >= 18.0.0
- **Claude Code** - Anthropic公式CLI
- **Git**（推奨）- バージョン管理用
- **LibreOffice**（任意）- プレビュー生成用

### LibreOfficeのインストール

```bash
# macOS
brew install --cask libreoffice

# Ubuntu/Debian
sudo apt install libreoffice

# Arch Linux
sudo pacman -S libreoffice-fresh
```

## まとめ

ClaudeSlideは、「AIでパワポを作る」という流行に対する私なりの回答です。

Gemini 3.0やNano Banana Proによるゼロからの生成は確かに革新的ですが、企業ユースケースでは**既存の資産を活かしながらAIの力で編集する**アプローチの方が実用的だと考えています。

Claude Opus 4.5のXML理解力は驚くほど高く、OOXMLのような複雑な規格でも正確に編集できます。この能力をClaude Codeのエージェント機能と組み合わせることで、自然言語だけでパワポを編集できる環境が実現しました。

ぜひ試してみてください：

```bash
npx claudeslide init your-template.pptx --name test-project
```

## リンク

- [npm: claudeslide](https://www.npmjs.com/package/claudeslide)
- [GitHub: claude-slide](https://github.com/Ameyanagi/ClaudeSlide)

## ライセンス

MIT © Ameyanagi
