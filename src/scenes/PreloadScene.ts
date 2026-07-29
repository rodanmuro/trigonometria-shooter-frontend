import Phaser from 'phaser';
import { AuthManager } from '../managers/AuthManager';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Cargar sonidos del juego
    console.log('PreloadScene: Loading assets...');

    // Cargar sonido de disparo
    this.load.audio('shoot', [
      'sounds/shoot.ogg',
      'sounds/shoot.mp3'
    ]);

    // Cargar sonido de explosión
    this.load.audio('explosion', [
      'sounds/explosion.ogg',
      'sounds/explosion.mp3'
    ]);

    // Cargar sonido de acierto correcto
    this.load.audio('correct', [
      'sounds/correct.ogg',
      'sounds/correct.mp3'
    ]);

    // Cargar sonido de acierto incorrecto
    this.load.audio('wrong', [
      'sounds/wrong.ogg',
      'sounds/wrong.mp3'
    ]);
  }

  create(): void {
    console.log('PreloadScene: Assets loaded');

    // Verificar si el usuario está autenticado
    const authManager = AuthManager.getInstance();
    const isAuthenticated = authManager.isAuthenticated();

    if (isAuthenticated) {
      const user = authManager.getUser();
      console.log('Usuario autenticado:', user?.name);
      console.log('Iniciando juego directamente...');
      // Si está autenticado, ir directo al juego
      this.scene.start('GameScene');
    } else {
      console.log('Usuario no autenticado, mostrando pantalla de login...');
      // Si no está autenticado, mostrar pantalla de login
      this.scene.start('LoginScene');
    }
  }
}
