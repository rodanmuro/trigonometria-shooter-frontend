import Phaser from 'phaser';
import type { TriangleQuestion, TriangleSide } from '../types';
import { COLOR, FONT_SIZE } from '../ui/theme';
import { getLayout } from '../ui/layout';

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

// Posición vertical natural del triángulo y cuánto baja por cada unidad de escala extra del HUD,
// para que el vértice A (arriba) no pise la pregunta ni el temporizador, que también crecen
const BASE_Y = 300;
const Y_SHIFT_PER_HUD_SCALE = 150;

const NORMAL_VERTEX_COLOR = COLOR.white;
const ANGLE_VALUE_COLOR = COLOR.green;

// Posición del texto del valor en grados, hacia el interior del triángulo
// desde cada vértice (A o B, el que sea el ángulo de referencia).
const ANGLE_VALUE_OFFSET: Record<'A' | 'B', Point> = {
  A: { x: VERTEX_A.x + 24, y: VERTEX_A.y + 28 },
  B: { x: VERTEX_B.x - 42, y: VERTEX_B.y - 20 },
};

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
  private angleValueText: Phaser.GameObjects.Text;
  private currentQuestion: TriangleQuestion | null = null;
  private baseScale: number;

  constructor(scene: Phaser.Scene) {
    const hudScale = getLayout(scene).hudScale;
    super(scene, scene.cameras.main.centerX, BASE_Y + Y_SHIFT_PER_HUD_SCALE * (hudScale - 1));
    this.baseScale = hudScale;

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

    this.angleValueText = scene.add.text(0, 0, '', {
      fontSize: FONT_SIZE.lg,
      color: ANGLE_VALUE_COLOR,
      fontStyle: 'bold',
      stroke: COLOR.black,
      strokeThickness: 4,
    });
    this.angleValueText.setOrigin(0.5);

    this.add([
      this.triangleGraphics,
      this.sideTexts.a,
      this.sideTexts.b,
      this.sideTexts.c,
      this.vertexTextA,
      this.vertexTextB,
      this.vertexTextC,
      this.angleValueText,
    ]);

    // Se agranda en pantallas pequeñas (1 en escritorio); los textos se dibujan a mayor resolución
    this.setScale(this.baseScale);
    [...Object.values(this.sideTexts), this.vertexTextA, this.vertexTextB, this.vertexTextC, this.angleValueText]
      .forEach((text) => text.setResolution(this.baseScale));

    scene.add.existing(this);
    this.setDepth(80);
  }

  private vertexStyle() {
    return {
      fontSize: FONT_SIZE.xlPlus,
      color: NORMAL_VERTEX_COLOR,
      fontStyle: 'bold',
      stroke: COLOR.black,
      strokeThickness: 4,
    };
  }

  private createSideText(scene: Phaser.Scene, p1: Point, p2: Point, offsetX: number, offsetY: number): Phaser.GameObjects.Text {
    const midX = (p1.x + p2.x) / 2 + offsetX;
    const midY = (p1.y + p2.y) / 2 + offsetY;
    const text = scene.add.text(midX, midY, '', {
      fontSize: FONT_SIZE.xl,
      color: COLOR.yellow,
      fontStyle: 'bold',
      stroke: COLOR.black,
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
   * Actualiza las etiquetas de lados y marca el ángulo de referencia (A o B)
   * con su valor en grados (más claro para el estudiante que solo un color)
   */
  public setQuestion(question: TriangleQuestion): void {
    this.currentQuestion = question;

    (['a', 'b', 'c'] as TriangleSide[]).forEach((side) => {
      this.sideTexts[side].setText(question.sideLabels[side] ?? '');
    });

    this.vertexTextA.setColor(NORMAL_VERTEX_COLOR);
    this.vertexTextB.setColor(NORMAL_VERTEX_COLOR);

    const offset = ANGLE_VALUE_OFFSET[question.referenceAngle];
    this.angleValueText.setText(`${question.angleDegrees}°`);
    this.angleValueText.setPosition(offset.x, offset.y);

    this.animateIn();
  }

  public getCurrentQuestion(): TriangleQuestion | null {
    return this.currentQuestion;
  }

  private animateIn(): void {
    this.setScale(this.baseScale * 0.85);
    this.setAlpha(0.3);

    this.scene.tweens.add({
      targets: this,
      scaleX: this.baseScale,
      scaleY: this.baseScale,
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
