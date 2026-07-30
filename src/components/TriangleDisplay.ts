import Phaser from 'phaser';
import type { TriangleQuestion, TriangleSide } from '../types';

interface Point {
  x: number;
  y: number;
}

// Triángulo fijo, sin rotar: C (ángulo recto) abajo-izquierda, A arriba, B abajo-derecha.
// Coordenadas relativas al contenedor (no a escala real de los valores).
const VERTEX_C: Point = { x: -70, y: 90 };
const VERTEX_A: Point = { x: -70, y: -110 };
const VERTEX_B: Point = { x: 110, y: 90 };

const RIGHT_ANGLE_MARK_SIZE = 16;

const HIGHLIGHT_COLOR = '#00ff00';
const NORMAL_VERTEX_COLOR = '#ffffff';

/**
 * Dibuja el triángulo rectángulo fijo del Juego 2 y las etiquetas de sus
 * lados (valor conocido / "X") y del ángulo de referencia (A o B) según la
 * pregunta activa.
 */
export class TriangleDisplay extends Phaser.GameObjects.Container {
  private triangleGraphics: Phaser.GameObjects.Graphics;
  private sideTexts: Record<TriangleSide, Phaser.GameObjects.Text>;
  private vertexTextA: Phaser.GameObjects.Text;
  private vertexTextB: Phaser.GameObjects.Text;
  private vertexTextC: Phaser.GameObjects.Text;
  private currentQuestion: TriangleQuestion | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, scene.cameras.main.centerX, 300);

    this.triangleGraphics = scene.add.graphics();
    this.drawTriangleShape();

    this.sideTexts = {
      a: this.createSideText(scene, VERTEX_B, VERTEX_C, 0, 22),
      b: this.createSideText(scene, VERTEX_A, VERTEX_C, -30, 0),
      c: this.createSideText(scene, VERTEX_A, VERTEX_B, 24, -14),
    };

    this.vertexTextA = scene.add.text(VERTEX_A.x, VERTEX_A.y - 26, 'A', this.vertexStyle());
    this.vertexTextB = scene.add.text(VERTEX_B.x + 22, VERTEX_B.y, 'B', this.vertexStyle());
    this.vertexTextC = scene.add.text(VERTEX_C.x - 24, VERTEX_C.y + 6, 'C', this.vertexStyle());
    [this.vertexTextA, this.vertexTextB, this.vertexTextC].forEach((text) => text.setOrigin(0.5));

    this.add([
      this.triangleGraphics,
      this.sideTexts.a,
      this.sideTexts.b,
      this.sideTexts.c,
      this.vertexTextA,
      this.vertexTextB,
      this.vertexTextC,
    ]);

    scene.add.existing(this);
    this.setDepth(80);
  }

  private vertexStyle() {
    return {
      fontSize: '26px',
      color: NORMAL_VERTEX_COLOR,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    };
  }

  private createSideText(scene: Phaser.Scene, p1: Point, p2: Point, offsetX: number, offsetY: number): Phaser.GameObjects.Text {
    const midX = (p1.x + p2.x) / 2 + offsetX;
    const midY = (p1.y + p2.y) / 2 + offsetY;
    const text = scene.add.text(midX, midY, '', {
      fontSize: '24px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    text.setOrigin(0.5);
    return text;
  }

  private drawTriangleShape(): void {
    this.triangleGraphics.fillStyle(0x16213e, 0.9);
    this.triangleGraphics.fillTriangle(VERTEX_A.x, VERTEX_A.y, VERTEX_B.x, VERTEX_B.y, VERTEX_C.x, VERTEX_C.y);
    this.triangleGraphics.lineStyle(3, 0x3498db, 1);
    this.triangleGraphics.strokeTriangle(VERTEX_A.x, VERTEX_A.y, VERTEX_B.x, VERTEX_B.y, VERTEX_C.x, VERTEX_C.y);

    // Marcador de ángulo recto en C
    this.triangleGraphics.lineStyle(2, 0xffffff, 1);
    this.triangleGraphics.strokeRect(
      VERTEX_C.x,
      VERTEX_C.y - RIGHT_ANGLE_MARK_SIZE,
      RIGHT_ANGLE_MARK_SIZE,
      RIGHT_ANGLE_MARK_SIZE
    );
  }

  /**
   * Actualiza las etiquetas de lados y resalta el ángulo de referencia (A o B)
   */
  public setQuestion(question: TriangleQuestion): void {
    this.currentQuestion = question;

    (['a', 'b', 'c'] as TriangleSide[]).forEach((side) => {
      this.sideTexts[side].setText(question.sideLabels[side] ?? '');
    });

    this.vertexTextA.setColor(question.referenceAngle === 'A' ? HIGHLIGHT_COLOR : NORMAL_VERTEX_COLOR);
    this.vertexTextB.setColor(question.referenceAngle === 'B' ? HIGHLIGHT_COLOR : NORMAL_VERTEX_COLOR);

    this.animateIn();
  }

  public getCurrentQuestion(): TriangleQuestion | null {
    return this.currentQuestion;
  }

  private animateIn(): void {
    this.setScale(0.85);
    this.setAlpha(0.3);

    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  public showCorrectFeedback(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0.4,
      duration: 100,
      yoyo: true,
      repeat: 2,
    });
  }

  public showWrongFeedback(): void {
    const originalX = this.x;

    this.scene.tweens.add({
      targets: this,
      x: originalX - 10,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.x = originalX;
      },
    });
  }
}
