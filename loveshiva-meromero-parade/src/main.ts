import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

/**
 * ゲーム起動エントリ。
 * 画面設計: 縦長 720 x 1280 を基準に Scale.FIT で端末へ合わせる。
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#1a0f1e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 720,
    height: 1280,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  scene: [BootScene, GameScene],
};

export const game = new Phaser.Game(config);
