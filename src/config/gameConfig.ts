import Phaser from 'phaser';
import { PreloadScene } from '../scenes/PreloadScene';
import { LoginScene } from '../scenes/LoginScene';
import { MenuScene } from '../scenes/MenuScene';
import { RatioIdentificationScene } from '../scenes/RatioIdentificationScene';
import { TriangleApplicationScene } from '../scenes/TriangleApplicationScene';
import AdminScene from '../scenes/AdminScene';

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
  scene: [PreloadScene, LoginScene, MenuScene, RatioIdentificationScene, TriangleApplicationScene, AdminScene]
};
