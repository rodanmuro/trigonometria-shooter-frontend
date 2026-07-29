import './style.css';
import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';

const game = new Phaser.Game(gameConfig);

(window as any).game = game;
