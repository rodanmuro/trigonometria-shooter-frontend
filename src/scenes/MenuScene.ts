import Phaser from 'phaser';

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
  }

  private createGameButton(y: number, title: string, description: string, onClick: () => void): void {
    const centerX = this.cameras.main.centerX;

    const button = this.add.container(centerX, y);

    const background = this.add.rectangle(0, 0, 560, 100, 0x2c3e50);
    background.setStrokeStyle(3, 0x3498db);

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

    background.on('pointerover', () => {
      background.setFillStyle(0x34495e);
      button.setScale(1.03);
    });
    background.on('pointerout', () => {
      background.setFillStyle(0x2c3e50);
      button.setScale(1);
    });
    background.on('pointerdown', onClick);
  }
}
