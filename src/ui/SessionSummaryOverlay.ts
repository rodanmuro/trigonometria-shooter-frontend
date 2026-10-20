import Phaser from 'phaser';
import { COLOR, FONT_SIZE } from './theme';
import { getLayout } from './layout';
import { createButton } from './widgets/Button';

const OVERLAY_DEPTH = 3000;
const CONTENT_DEPTH = 3001;

/**
 * Pantalla de fin de sesión: resumen de estadísticas → (clic) → confirmación
 * "¿Seguro que deseas iniciar una nueva sesión?" → SÍ reinicia / NO vuelve al resumen.
 * La capa oscura se crea una sola vez, aunque se alterne entre resumen y confirmación.
 * Si se da `onMenu`, el resumen ofrece además un botón para volver al menú principal (cambiar de juego).
 */
export class SessionSummaryOverlay {
  private backdrop: Phaser.GameObjects.Rectangle | null = null;
  private current: Phaser.GameObjects.GameObject[] = [];
  private scene: Phaser.Scene;
  private statsText: string;
  private onRestart: () => void;
  private onMenu: (() => void) | undefined;
  private removeRestartListener: (() => void) | null = null;

  /**
   * @param statsText líneas de estadísticas ya formateadas
   * @param onRestart se invoca al confirmar con SÍ
   * @param onMenu se invoca al pulsar "Menú principal" (sin confirmación: la sesión ya terminó)
   */
  constructor(scene: Phaser.Scene, statsText: string, onRestart: () => void, onMenu?: () => void) {
    this.scene = scene;
    this.statsText = statsText;
    this.onRestart = onRestart;
    this.onMenu = onMenu;
  }

  show(): void {
    this.showSummary();
  }

  /**
   * Cuánto crece el HUD respecto al tamaño de escritorio (0 en escritorio). En pantallas pequeñas
   * los textos y botones se agrandan y los bloques se separan para que no se pisen.
   */
  private get grow(): number {
    return getLayout(this.scene).hudScale - 1;
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

    const u = this.grow;
    const titleScale = 1 + 0.35 * u;
    const bodyScale = 1 + 0.47 * u;

    const title = scene.add
      .text(centerX, centerY - 150 - 130 * u, '¡SESIÓN COMPLETADA!', {
        fontSize: FONT_SIZE.hero,
        color: COLOR.yellow,
        fontStyle: 'bold',
        stroke: COLOR.black,
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setScale(titleScale)
      .setResolution(titleScale)
      .setDepth(CONTENT_DEPTH);

    const stats = scene.add
      .text(centerX, centerY + 23 * u, this.statsText, {
        fontSize: FONT_SIZE.title,
        color: COLOR.white,
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 10,
      })
      .setOrigin(0.5)
      .setScale(bodyScale)
      .setResolution(bodyScale)
      .setDepth(CONTENT_DEPTH);

    const restartText = scene.add
      .text(centerX, centerY + 150 + 140 * u, 'Haz clic para nueva sesión', {
        fontSize: FONT_SIZE.xxl,
        color: COLOR.green,
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setScale(bodyScale)
      .setResolution(bodyScale)
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

    // Reiniciar al hacer clic en cualquier parte (con confirmación)
    const onPointerDown = (): void => this.showConfirmation();
    scene.input.once('pointerdown', onPointerDown);
    this.removeRestartListener = () => scene.input.off('pointerdown', onPointerDown);

    if (this.onMenu) {
      const onMenu = this.onMenu;
      const menuButton = createButton(scene, {
        x: centerX,
        y: restartText.y + 70 + 40 * u,
        text: '☰ Menú principal',
        fontSize: FONT_SIZE.xl,
        bg: '#333333',
        padding: { x: 24, y: 10 },
        scale: bodyScale,
        hover: { bg: '#555555' },
        depth: CONTENT_DEPTH,
        // El manejador del botón corre antes que el del clic "en cualquier parte": se retira éste
        // para que el mismo toque no abra la confirmación de reinicio
        onClick: () => {
          this.removeRestartListener?.();
          onMenu();
        },
      });
      this.current.push(menuButton);
    }
  }

  private showConfirmation(): void {
    const { scene } = this;
    const { centerX, centerY } = scene.cameras.main;

    this.current.forEach((obj) => obj.destroy());

    const u = this.grow;
    const textScale = 1 + 0.2 * u;
    const buttonScale = 1 + u;

    const confirmText = scene.add
      .text(centerX, centerY - 60 - 20 * u, '¿Seguro que deseas iniciar\nuna nueva sesión?', {
        fontSize: FONT_SIZE.display,
        color: COLOR.yellow,
        fontStyle: 'bold',
        stroke: COLOR.black,
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5)
      .setScale(textScale)
      .setResolution(textScale)
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
      x: centerX - 100 * buttonScale,
      y: centerY + 80 + 40 * u,
      text: 'SÍ',
      fontSize: FONT_SIZE.h1,
      color: COLOR.green,
      bg: '#004400',
      padding: { x: 30, y: 15 },
      extra: { fontStyle: 'bold', stroke: COLOR.black, strokeThickness: 4 },
      scale: buttonScale,
      hover: { scale: 1.1 },
      depth: CONTENT_DEPTH,
      onClick: choice(() => this.onRestart()),
    });

    // Botón NO - volver al resumen
    const noButton = createButton(scene, {
      x: centerX + 100 * buttonScale,
      y: centerY + 80 + 40 * u,
      text: 'NO',
      fontSize: FONT_SIZE.h1,
      color: COLOR.red,
      bg: '#440000',
      padding: { x: 30, y: 15 },
      extra: { fontStyle: 'bold', stroke: COLOR.black, strokeThickness: 4 },
      scale: buttonScale,
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
