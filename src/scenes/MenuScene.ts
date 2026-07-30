import Phaser from 'phaser';
import { AuthManager } from '../managers/AuthManager';

/**
 * Menú de selección de juego, entre el login y las escenas de juego
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const title = this.add.text(
      this.cameras.main.centerX,
      140,
      'TRIGONOMETRIA SHOOTER',
      {
        fontSize: '52px',
        color: '#ffff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center'
      }
    );
    title.setOrigin(0.5);

    const subtitle = this.add.text(
      this.cameras.main.centerX,
      220,
      'Elegí un juego',
      {
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'italic'
      }
    );
    subtitle.setOrigin(0.5);

    this.createGameButton(
      this.cameras.main.centerY,
      'JUEGO 1: Identificar razones',
      'Seno, coseno o tangente → ¿qué fórmula la resuelve?',
      () => this.scene.start('RatioIdentificationScene')
    );

    this.createGameButton(
      this.cameras.main.centerY + 140,
      'JUEGO 2: Aplicar en el triángulo',
      'Un triángulo con datos → ¿qué razón resuelve X?',
      () => this.scene.start('TriangleApplicationScene')
    );

    const user = AuthManager.getInstance().getUser();
    if (user?.profile === 'admin') {
      this.createGameButton(
        this.cameras.main.centerY + 280,
        'PANEL ADMIN',
        'Ver estudiantes, sesiones y cargar/exportar CSV',
        () => this.scene.start('AdminScene'),
        0x662222,
        0xcc4444
      );
    }
  }

  private createGameButton(
    y: number,
    title: string,
    description: string,
    onClick: () => void,
    fillColor: number = 0x2c3e50,
    strokeColor: number = 0x3498db
  ): void {
    const centerX = this.cameras.main.centerX;

    const button = this.add.container(centerX, y);

    const background = this.add.rectangle(0, 0, 560, 100, fillColor);
    background.setStrokeStyle(3, strokeColor);

    const titleText = this.add.text(0, -18, title, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    titleText.setOrigin(0.5);

    const descriptionText = this.add.text(0, 20, description, {
      fontSize: '16px',
      color: '#cccccc'
    });
    descriptionText.setOrigin(0.5);

    button.add([background, titleText, descriptionText]);

    background.setInteractive({ useHandCursor: true });

    const hoverColor = Phaser.Display.Color.IntegerToColor(fillColor).brighten(15).color;

    background.on('pointerover', () => {
      background.setFillStyle(hoverColor);
      button.setScale(1.03);
    });
    background.on('pointerout', () => {
      background.setFillStyle(fillColor);
      button.setScale(1);
    });
    background.on('pointerdown', onClick);
  }
}
