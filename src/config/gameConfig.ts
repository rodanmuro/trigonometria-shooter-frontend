import Phaser from 'phaser';
import { PreloadScene } from '../scenes/PreloadScene';
import { LoginScene } from '../scenes/LoginScene';
import { GameScene } from '../scenes/GameScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1200,
  height: 800,
  parent: 'app',
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false }
  },
  scene: [PreloadScene, LoginScene, GameScene]
};
