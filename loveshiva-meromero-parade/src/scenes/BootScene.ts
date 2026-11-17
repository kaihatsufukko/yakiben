import Phaser from 'phaser';
import { soundManager } from '../audio/SoundManager';

/**
 * BootScene（タイトル画面）:
 * - タイトル文字「ラブシバ メロメロ大行進」
 * - 仮の豆柴スプライト（図形描画。後から AI 生成素材へ差し替え可能にする）
 * - スタートボタン → GameScene へ遷移
 * - 画面右上に「♪」音声オン/オフボタン（SoundManager と連動）
 */
export class BootScene extends Phaser.Scene {
  private soundButton?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#ffeef7');

    // タイトル
    this.add
      .text(width / 2, height * 0.22, 'ラブシバ\nメロメロ大行進', {
        fontFamily: 'sans-serif',
        fontSize: '72px',
        color: '#d63384',
        align: 'center',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.36, '豆柴のハートで みんなメロメロ!', {
        fontFamily: 'sans-serif',
        fontSize: '30px',
        color: '#7a4a63',
        align: 'center',
      })
      .setOrigin(0.5);

    // 仮の豆柴（図形描画のプレースホルダ。素材はコードから分離する前提で、
    // 実装時はこの生成処理をテクスチャ差し替えに置換する）
    this.drawPlaceholderShiba(width / 2, height * 0.58);

    // ハート（仮）
    this.add
      .text(width / 2 + 130, height * 0.5, '💗', {
        fontSize: '56px',
      })
      .setOrigin(0.5);

    // スタートボタン
    const startButton = this.add
      .text(width / 2, height * 0.74, '▶ スタート', {
        fontFamily: 'sans-serif',
        fontSize: '48px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#ff5c8a',
        padding: { x: 44, y: 20 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on('pointerdown', () => {
      soundManager.unlock();
      this.scene.start('GameScene');
    });

    this.add
      .text(width / 2, height * 0.82, 'ドラッグ / ←→キーで豆柴を動かそう', {
        fontFamily: 'sans-serif',
        fontSize: '26px',
        color: '#7a4a63',
        align: 'center',
      })
      .setOrigin(0.5);

    // 音声オン/オフボタン（右上「♪」。SoundManager と連動）
    this.soundButton = this.add
      .text(width - 48, 48, soundManager.enabled ? '♪' : '♪̸', {
        fontFamily: 'sans-serif',
        fontSize: '44px',
        color: soundManager.enabled ? '#d63384' : '#999999',
        backgroundColor: '#ffffff',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });

    this.soundButton.on('pointerdown', () => {
      this.toggleSound();
    });
  }

  private toggleSound(): void {
    soundManager.unlock();
    soundManager.setEnabled(!soundManager.enabled);
    this.soundButton?.setText(soundManager.enabled ? '♪' : '♪̸');
    this.soundButton?.setColor(soundManager.enabled ? '#d63384' : '#999999');
  }

  private drawPlaceholderShiba(x: number, y: number): void {
    const g = this.add.graphics();

    // 体（後ろ姿イメージの楕円）
    g.fillStyle(0xd9a066, 1);
    g.fillEllipse(x, y, 170, 150);
    // 頭
    g.fillStyle(0xe0aa6e, 1);
    g.fillCircle(x, y - 95, 62);
    // 耳
    g.fillStyle(0xc98d4e, 1);
    g.fillTriangle(x - 58, y - 130, x - 22, y - 138, x - 46, y - 172);
    g.fillTriangle(x + 58, y - 130, x + 22, y - 138, x + 46, y - 172);
    // 巻き尾（後ろ姿の目印）
    g.lineStyle(16, 0xc98d4e, 1);
    g.beginPath();
    g.arc(x + 78, y + 38, 26, Phaser.Math.DegToRad(300), Phaser.Math.DegToRad(140), false);
    g.strokePath();
    // 首元の白
    g.fillStyle(0xfff6ec, 1);
    g.fillEllipse(x, y + 42, 92, 62);
  }
}
