import Phaser from 'phaser';
import { PreloadScene } from '../scenes/PreloadScene';
import { LoginScene } from '../scenes/LoginScene';
import { MenuScene } from '../scenes/MenuScene';
import { RatioIdentificationScene } from '../scenes/RatioIdentificationScene';
import { TriangleApplicationScene } from '../scenes/TriangleApplicationScene';
import AdminScene from '../scenes/AdminScene';
import StatsScene from '../scenes/StatsScene';
import { COLOR } from '../ui/theme';
import { computeWorldWidth, WORLD_HEIGHT } from '../ui/layout';

// Se calcula una vez al arrancar, según la proporción de la pantalla
const WORLD_WIDTH = computeWorldWidth(window.innerWidth, window.innerHeight);

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  // El mundo del juego mide 800 de alto y entre 1200 y 1800 de ancho según la pantalla; el lienzo
  // se ajusta (sin deformar) al espacio disponible y nunca se agranda por encima de su tamaño base.
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    max: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
  },
  backgroundColor: COLOR.navy,
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false }
  },
  scene: [PreloadScene, LoginScene, MenuScene, RatioIdentificationScene, TriangleApplicationScene, StatsScene, AdminScene]
};
