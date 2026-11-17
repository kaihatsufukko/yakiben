import Phaser from 'phaser';

export interface ResultStats {
  lovePercent: number;
  stars: number;
  maxShibas: number;
  maxCombo: number;
  clearTimeSec: number;
  melomeloCount: number;
  totalEnemies: number;
}

/**
 * ゲーム中 UI とクリア評価画面。
 * ♪ボタンの表示仕様は BootScene と共通（押下時の処理はコールバックへ委譲）。
 */
export class Hud {
  private readonly scene: Phaser.Scene;
  private readonly countText: Phaser.GameObjects.Text;
  private readonly loveText: Phaser.GameObjects.Text;
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly debugText: Phaser.GameObjects.Text;
  private readonly soundButton: Phaser.GameObjects.Text;
  private shownCombo = 0;

  /** @param onToggleSound 押下時に呼ばれ、新しい enabled 状態を返す */
  constructor(scene: Phaser.Scene, onToggleSound: () => boolean) {
    this.scene = scene;
    const { width } = scene.scale;

    this.countText = scene.add
      .text(24, 20, '🐶 × 1', {
        fontFamily: 'sans-serif',
        fontSize: '40px',
        color: '#7a2d52',
        fontStyle: 'bold',
        backgroundColor: '#ffffffcc',
        padding: { x: 12, y: 6 },
      })
      .setDepth(30);

    this.loveText = scene.add
      .text(24, 84, 'LOVE 0%', {
        fontFamily: 'sans-serif',
        fontSize: '30px',
        color: '#d63384',
        fontStyle: 'bold',
        backgroundColor: '#ffffffcc',
        padding: { x: 12, y: 4 },
      })
      .setDepth(30);

    this.comboText = scene.add
      .text(width / 2, 150, '', {
        fontFamily: 'sans-serif',
        fontSize: '64px',
        color: '#ff5c8a',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setVisible(false);

    this.debugText = scene.add
      .text(16, 1236, '', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#5a4050',
        backgroundColor: '#ffffff99',
        padding: { x: 8, y: 4 },
      })
      .setDepth(30);

    this.soundButton = scene.add
      .text(width - 48, 48, '♪', {
        fontFamily: 'sans-serif',
        fontSize: '44px',
        color: '#d63384',
        backgroundColor: '#ffffff',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(1, 0)
      .setDepth(30)
      .setInteractive({ useHandCursor: true });

    this.soundButton.on('pointerdown', () => {
      const enabled = onToggleSound();
      this.setSoundButton(enabled);
    });
  }

  setSoundButton(enabled: boolean): void {
    this.soundButton.setText(enabled ? '♪' : '♪̸');
    this.soundButton.setColor(enabled ? '#d63384' : '#999999');
  }

  setCount(count: number): void {
    this.countText.setText(`🐶 × ${count}`);
  }

  setLove(percent: number): void {
    this.loveText.setText(`LOVE ${Math.round(percent)}%`);
  }

  /** コンボ表示。2以上で表示し、増えた瞬間にポップさせる */
  showCombo(combo: number): void {
    if (combo < 2) {
      this.hideCombo();
      return;
    }
    this.comboText.setText(`${combo} コンボ!`).setVisible(true);
    if (combo !== this.shownCombo) {
      this.shownCombo = combo;
      this.scene.tweens.killTweensOf(this.comboText);
      this.comboText.setScale(1.35);
      this.scene.tweens.add({ targets: this.comboText, scale: 1, duration: 140 });
    }
  }

  hideCombo(): void {
    this.shownCombo = 0;
    this.comboText.setVisible(false);
  }

  setDebug(text: string, visible: boolean): void {
    this.debugText.setText(text).setVisible(visible);
  }

  /** ゲート通過などの一時的なフローティング表示 */
  floatText(x: number, y: number, text: string, color = '#d63384'): void {
    const t = this.scene.add
      .text(x, y, text, {
        fontFamily: 'sans-serif',
        fontSize: '44px',
        color,
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(31);
    this.scene.tweens.add({
      targets: t,
      y: y - 90,
      alpha: 0,
      duration: 900,
      onComplete: () => t.destroy(),
    });
  }

  /** クリア評価パネルを表示する */
  showResult(stats: ResultStats, onRestart: () => void, onTitle: () => void): void {
    const { width, height } = this.scene.scale;
    const container = this.scene.add.container(0, 0).setDepth(40);

    const dim = this.scene.add.rectangle(0, 0, width, height, 0x2b1030, 0.55).setOrigin(0, 0);
    const panel = this.scene.add
      .rectangle(width / 2, height / 2, 600, 780, 0xfff5fa, 1)
      .setStrokeStyle(6, 0xff8fb8);

    const title = this.scene.add
      .text(width / 2, height / 2 - 320, 'ステージクリア!', {
        fontFamily: 'sans-serif',
        fontSize: '54px',
        color: '#d63384',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const starsText = '★'.repeat(stats.stars) + '☆'.repeat(Math.max(0, 3 - stats.stars));
    const stars = this.scene.add
      .text(width / 2, height / 2 - 235, starsText, {
        fontFamily: 'sans-serif',
        fontSize: '84px',
        color: '#ffb400',
      })
      .setOrigin(0.5);

    const lines = [
      `LOVE% ......... ${Math.round(stats.lovePercent)}%`,
      `メロメロ ....... ${stats.melomeloCount} / ${stats.totalEnemies}`,
      `最大豆柴 ....... ${stats.maxShibas} 匹`,
      `最大コンボ ..... ${stats.maxCombo}`,
      `クリア時間 ..... ${stats.clearTimeSec.toFixed(1)} 秒`,
    ];
    const body = this.scene.add
      .text(width / 2, height / 2 - 120, lines.join('\n'), {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        color: '#5a2d44',
        lineSpacing: 18,
      })
      .setOrigin(0.5, 0);

    const makeButton = (
      y: number,
      label: string,
      fill: number,
      onClick: () => void,
    ): Phaser.GameObjects.GameObject[] => {
      const rect = this.scene.add
        .rectangle(width / 2, y, 360, 84, fill, 1)
        .setInteractive({ useHandCursor: true });
      const text = this.scene.add
        .text(width / 2, y, label, {
          fontFamily: 'sans-serif',
          fontSize: '38px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      rect.on('pointerdown', onClick);
      return [rect, text];
    };

    const restartBtn = makeButton(height / 2 + 245, 'もう一度あそぶ', 0xff5c8a, onRestart);
    const titleBtn = makeButton(height / 2 + 345, 'タイトルへ', 0x9a7b8f, onTitle);

    container.add([dim, panel, title, stars, body, ...restartBtn, ...titleBtn]);
  }
}
