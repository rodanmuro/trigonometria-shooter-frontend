import Phaser from 'phaser';
import { Crosshair } from '../entities/Crosshair';
import { ShotMarker } from '../entities/ShotMarker';
import { CardSpawner } from '../systems/CardSpawner';
import { ScoreManager } from '../systems/ScoreManager';
import { ScoreDisplay } from '../components/ScoreDisplay';
import { AudioManager } from '../managers/AudioManager';
import { ProgressionManager } from '../managers/ProgressionManager';
import { SessionTimer } from '../components/SessionTimer';
import { GAME_CONFIG } from '../utils/constants';
import { sessionApiService } from '../services/sessionApiService';
import { shotApiService } from '../services/shotApiService';
import type { Card } from '../entities/Card';
import type { RecordShotPayload, FinishedSessionData, GameMode } from '../types/api';
import { COLOR, FONT_SIZE } from '../ui/theme';
import { formatClock } from '../utils/format';
import { SessionSummaryOverlay } from '../ui/SessionSummaryOverlay';

/**
 * Infraestructura genérica compartida por ambos juegos: ciclo de vida de la
 * sesión, timer, puntaje, progresión de velocidad, pantallas de resumen y el
 * flujo de disparo (mira, colisión con las cartas). Cada juego solo define
 * cómo se genera/muestra su "pregunta" y qué payload manda por cada disparo.
 */
export abstract class BaseGameScene extends Phaser.Scene {
  protected crosshair!: Crosshair;
  protected cardSpawner!: CardSpawner;
  protected scoreManager!: ScoreManager;
  protected scoreDisplay!: ScoreDisplay;
  protected audioManager!: AudioManager;
  protected progressionManager!: ProgressionManager;
  protected sessionTimer!: Phaser.Time.TimerEvent;
  protected sessionTimerDisplay!: SessionTimer;
  protected sessionEnded: boolean = false;
  protected sessionId: number | null = null;
  protected lastFinishedSessionData: FinishedSessionData | null = null;

  protected abstract gameMode: GameMode;

  /** Crea el display de pregunta del juego y dispara la primera ronda */
  protected abstract initQuestion(): void;

  /** Arma una nueva pregunta, actualiza el display y reinicia el spawn de cartas */
  protected abstract generateNewQuestion(): void;

  /** Arma el payload específico del juego para el disparo que impactó una carta */
  protected abstract buildShotPayload(hitCard: Card, x: number, y: number): RecordShotPayload;

  protected abstract onCorrectFeedback(): void;
  protected abstract onWrongFeedback(): void;

  create(): void {
    // scene.restart() reutiliza la misma instancia: los campos de estado de la
    // partida anterior hay que reiniciarlos aquí, no solo al declararlos.
    this.sessionEnded = false;
    this.sessionId = null;
    this.lastFinishedSessionData = null;

    this.createGameSession();

    this.input.setDefaultCursor('none');

    this.crosshair = new Crosshair(this);

    this.cardSpawner = new CardSpawner(this);

    this.scoreManager = new ScoreManager();
    this.scoreDisplay = new ScoreDisplay(this);

    this.audioManager = new AudioManager(this);
    this.audioManager.registerSound('shoot');

    this.progressionManager = new ProgressionManager();

    this.sessionTimerDisplay = new SessionTimer(this, GAME_CONFIG.SESSION_DURATION);

    this.sessionTimer = this.time.delayedCall(
      GAME_CONFIG.SESSION_DURATION,
      this.endSession,
      [],
      this
    );

    this.scoreManager.setOnScoreChange((score, delta) => {
      this.scoreDisplay.updateScore(score, delta);

      const leveledUp = this.progressionManager.updateProgress(score);
      if (leveledUp) {
        this.onLevelUp(this.progressionManager.getCurrentLevel());
      }
    });

    this.initQuestion();

    this.input.on('pointerdown', this.onShoot, this);
  }

  update(_time: number, delta: number): void {
    const pointer = this.input.activePointer;
    this.crosshair.updatePosition(pointer.x, pointer.y);

    this.cardSpawner.update(delta);

    if (this.sessionTimer) {
      this.sessionTimerDisplay.update(this.sessionTimer.getRemaining());
    }
  }

  private onShoot(pointer: Phaser.Input.Pointer): void {
    if (this.sessionEnded) {
      return;
    }

    this.audioManager.play('shoot', { volume: 0.5 });

    new ShotMarker(this, pointer.x, pointer.y);

    this.crosshair.pulse();

    const hitCard = this.cardSpawner.checkHit(pointer.x, pointer.y);

    if (hitCard) {
      const wasCorrect = hitCard.isCorrect();

      if (wasCorrect) {
        this.scoreManager.addCorrectHit();
        hitCard.showHitCorrectEffect();
        this.onCorrectFeedback();
      } else {
        this.scoreManager.addWrongHit();
        hitCard.showHitWrongEffect();
        this.onWrongFeedback();
      }

      const payload = this.buildShotPayload(hitCard, pointer.x, pointer.y);
      this.cardSpawner.removeCard(hitCard);

      payload.current_score = this.scoreManager.getScore();
      payload.elapsed_seconds = this.sessionTimer
        ? Math.floor(this.sessionTimer.getElapsed() / 1000)
        : 0;

      this.recordShotToBackend(payload);
    }
  }

  /**
   * Envía el disparo al backend si hay sesión activa
   */
  private async recordShotToBackend(payload: RecordShotPayload): Promise<void> {
    try {
      if (!this.sessionId) {
        console.warn('No hay sessionId; no se registrará el disparo en backend');
        return;
      }

      const result = await shotApiService.recordShot(this.sessionId, payload);
      console.log('Disparo registrado en backend:', result);
    } catch (error) {
      console.error('Error registrando disparo en backend:', error);
    }
  }

  /**
   * Sube la velocidad de las cartas y muestra una notificación de subida de nivel
   */
  private onLevelUp(newLevel: number): void {
    const speedMultiplier = this.progressionManager.getSpeedMultiplier();
    this.cardSpawner.setSpeedMultiplier(speedMultiplier);

    console.log(`¡SUBIDA DE NIVEL! Nivel ${newLevel} - Velocidad x${speedMultiplier.toFixed(2)}`);

    const notification = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 100,
      `¡NIVEL ${newLevel}!\nCartas más rápidas`,
      {
        fontSize: FONT_SIZE.splash,
        color: COLOR.green,
        fontStyle: 'bold',
        stroke: COLOR.black,
        strokeThickness: 8,
        align: 'center'
      }
    );
    notification.setOrigin(0.5);
    notification.setDepth(2000);
    notification.setAlpha(0);

    this.tweens.add({
      targets: notification,
      alpha: 1,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 400,
      ease: 'Elastic.easeOut',
      yoyo: true,
      hold: 800,
      onComplete: () => {
        notification.destroy();
        // Cambiar de pregunta recién al subir de nivel, no en cada acierto
        this.generateNewQuestion();
      }
    });
  }

  /**
   * Crear sesión de juego en el backend
   */
  private async createGameSession(): Promise<void> {
    try {
      const startedAt = new Date().toISOString();
      const canvasW = this.cameras.main.width;
      const canvasH = this.cameras.main.height;

      const session = await sessionApiService.createSession(startedAt, canvasW, canvasH, this.gameMode);
      this.sessionId = session.id;

      console.log(`✅ Sesión de juego creada: ${this.sessionId}`);
    } catch (error) {
      console.error('❌ Error al crear sesión en backend:', error);
      console.warn('El juego continuará sin sincronización con backend');
    }
  }

  private async endSession(): Promise<void> {
    this.cardSpawner.stopSpawning();

    const elapsedMs = this.sessionTimer ? this.sessionTimer.getElapsed() : GAME_CONFIG.SESSION_DURATION;
    if (this.sessionTimer) {
      this.sessionTimer.remove();
    }

    console.log('¡SESIÓN COMPLETADA!');
    this.sessionEnded = true;

    if (this.sessionId) {
      try {
        const finalScore = this.scoreManager.getScore();
        const payload = {
          finished_at: new Date().toISOString(),
          final_score: finalScore,
          duration_seconds: Math.floor(elapsedMs / 1000)
        };

        const finished = await sessionApiService.finishSession(this.sessionId, payload);
        console.log('Sesión finalizada en backend:', finished);
        this.lastFinishedSessionData = finished;
      } catch (error) {
        console.error('Error al finalizar sesión en backend:', error);
      }
    }

    this.showSessionSummary();
  }

  private showSessionSummary(): void {
    const statsText = this.lastFinishedSessionData
      ? this.backendSummaryText(this.lastFinishedSessionData)
      : this.localSummaryText();

    new SessionSummaryOverlay(
      this,
      statsText,
      () => this.scene.restart(),
      () => this.scene.start('MenuScene')
    ).show();
  }

  private backendSummaryText(session: FinishedSessionData): string {
    return (
      `Puntuación Final: ${session.final_score}\n` +
      `Disparos Totales: ${session.total_shots}\n` +
      `Aciertos: ${session.correct_shots} | Errores: ${session.wrong_shots}\n` +
      `Precisión: ${session.accuracy}%\n` +
      `Tiempo Jugado: ${formatClock(session.duration_seconds)}`
    );
  }

  private localSummaryText(): string {
    return `Puntuación Final: ${this.scoreManager.getScore()}`;
  }
}
