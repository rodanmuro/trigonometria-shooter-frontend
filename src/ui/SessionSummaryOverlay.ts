import Phaser from 'phaser';
import { COLOR, FONT_SIZE } from './theme';
import { createButton } from './widgets/Button';

const OVERLAY_DEPTH = 3000;
const CONTENT_DEPTH = 3001;

/**
 * Pantalla de fin de sesión: resumen de estadísticas → (clic) → confirmación
 * "¿Seguro que deseas iniciar una nueva sesión?" → SÍ reinicia / NO vuelve al resumen.
 * La capa oscura se crea una sola vez, aunque se alterne entre resumen y confirmación.
 */
export class SessionSummaryOverlay {
  private backdrop: Phaser.GameObjects.Rectangle | null = null;
  private current: Phaser.GameObjects.GameObject[] = [];
  private scene: Phaser.Scene;
  private statsText: string;
  private onRestart: () => void;

  /**
   * @param statsText líneas de estadísticas ya formateadas
   * @param onRestart se invoca al confirmar con SÍ
   */
  constructor(scene: Phaser.Scene, statsText: string, onRestart: () => void) {
    this.scene = scene;
    this.statsText = statsText;
    this.onRestart = onRestart;
  }

  show(): void {
    this.showSummary();
  }

  private showSummary(): void {
    const { scene } = this;
    const { centerX, centerY, width, height } = scene.cameras.main;

    // Restaurar cursor normal
    scene.input.setDefaultCursor('default');

    if (!this.backdrop) {
      this.backdrop = scene.add
        .rectangle(centerX, centerY, width, height, 0x000000, 0.8)
        .setDepth(OVERLAY_DEPTH);
    }

    const title = scene.add
      .text(centerX, centerY - 150, '¡SESIÓN COMPLETADA!', {
        fontSize: FONT_SIZE.hero,
        color: COLOR.yellow,
        fontStyle: 'bold',
        stroke: COLOR.black,
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(CONTENT_DEPTH);

    const stats = scene.add
      .text(centerX, centerY, this.statsText, {
        fontSize: FONT_SIZE.title,
        color: COLOR.white,
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 10,
      })
      .setOrigin(0.5)
      .setDepth(CONTENT_DEPTH);

    const restartText = scene.add
      .text(centerX, centerY + 150, 'Haz clic para nueva sesión', {
        fontSize: FONT_SIZE.xxl,
        color: COLOR.green,
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setDepth(CONTENT_DEPTH);

    // Parpadeo del texto de reinicio
    scene.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.current = [title, stats, restartText];

    // Reiniciar al hacer clic (con confirmación)
    scene.input.once('pointerdown', () => this.showConfirmation());
  }

  private showConfirmation(): void {
    const { scene } = this;
    const { centerX, centerY } = scene.cameras.main;

    this.current.forEach((obj) => obj.destroy());

    const confirmText = scene.add
      .text(centerX, centerY - 60, '¿Seguro que deseas iniciar\nuna nueva sesión?', {
        fontSize: FONT_SIZE.display,
        color: COLOR.yellow,
        fontStyle: 'bold',
        stroke: COLOR.black,
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(CONTENT_DEPTH);

    // Evita que un doble clic dispare dos veces scene.restart() (crearía
    // dos sesiones en el backend, dejando una huérfana sin disparos).
    let choiceMade = false;

    const choice = (onChosen: () => void) => () => {
      if (choiceMade) return;
      choiceMade = true;
      yesButton.disableInteractive();
      noButton.disableInteractive();
      onChosen();
    };

    // Botón SÍ - reiniciar
    const yesButton = createButton(scene, {
      x: centerX - 100,
      y: centerY + 80,
      text: 'SÍ',
      fontSize: FONT_SIZE.h1,
      color: COLOR.green,
      bg: '#004400',
      padding: { x: 30, y: 15 },
      extra: { fontStyle: 'bold', stroke: COLOR.black, strokeThickness: 4 },
      hover: { scale: 1.1 },
      depth: CONTENT_DEPTH,
      onClick: choice(() => this.onRestart()),
    });

    // Botón NO - volver al resumen
    const noButton = createButton(scene, {
      x: centerX + 100,
      y: centerY + 80,
      text: 'NO',
      fontSize: FONT_SIZE.h1,
      color: COLOR.red,
      bg: '#440000',
      padding: { x: 30, y: 15 },
      extra: { fontStyle: 'bold', stroke: COLOR.black, strokeThickness: 4 },
      hover: { scale: 1.1 },
      depth: CONTENT_DEPTH,
      onClick: choice(() => {
        confirmText.destroy();
        yesButton.destroy();
        noButton.destroy();

        // Recrear el resumen en el fotograma siguiente: showSummary() registra un
        // input.once('pointerdown') y, si se hiciera aquí, este mismo clic lo dispararía
        // de inmediato y volvería a mostrar la confirmación.
        scene.time.delayedCall(0, () => this.showSummary());
      }),
    });

    this.current = [confirmText, yesButton, noButton];
  }
}
