import './devDemo';
import './style.css';
import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { enableFullscreenOnFirstTouch } from './ui/fullscreen';

const game = new Phaser.Game(gameConfig);

(window as any).game = game;

// En celular, el primer toque pone la página en pantalla completa y horizontal
enableFullscreenOnFirstTouch();
