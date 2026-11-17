# ラブシバ メロメロ大行進

豆柴がハートで女の子をメロメロにする、縦スクロール・カジュアルゲーム。
現在は **土台（スキャフォールド）のみ**。ステージ本体は未実装。

## 技術構成

- Phaser 3 + TypeScript + Vite
- 画面: 縦長 720 x 1280 基準、Phaser Scale Manager（FIT / autoCenter）
- テスト: Vitest（Phaser 非依存の純粋ロジックのみ対象）

## 起動方法

```bash
npm install
npm run dev      # 開発サーバ (http://localhost:5173)
npm run build    # 型チェック + 本番ビルド (dist/)
npm run typecheck
npm test         # vitest run
```

## ディレクトリ

- `src/main.ts` — Phaser 起動設定
- `src/scenes/BootScene.ts` — タイトル + 仮豆柴 + ♪ボタン仮 UI
- `src/data/stage1.ts` — ステージ設定（データ駆動の器）
- `src/logic/` — Phaser 非依存の純関数（LOVE% / ★評価など）とそのテスト

## 注意

- ElevenLabs 等の有料 API は事前承認制。実行時に API は呼ばない（素材は事前生成して保存する方針）。
- API キーは環境変数で管理し、ブラウザ側コードに含めない。
