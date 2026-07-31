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
        fontSize: '56px',
        color: '#00ff00',
        fontStyle: 'bold',
        stroke: '#000000',
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
    if (this.lastFinishedSessionData) {
      this.showSessionSummaryBackend(this.lastFinishedSessionData);
    } else {
      this.showSessionSummaryLocal();
    }
  }

  private showSessionSummaryLocal(): void {
    this.input.setDefaultCursor('default');

    const finalScore = this.scoreManager.getScore();

    const overlay = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.8
    );
    overlay.setDepth(3000);

    const summaryText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 150,
      '¡SESIÓN COMPLETADA!',
      {
        fontSize: '64px',
        color: '#ffff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8
      }
    );
    summaryText.setOrigin(0.5);
    summaryText.setDepth(3001);

    const statsText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      `Puntuación Final: ${finalScore}`,
      {
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 10
      }
    );
    statsText.setOrigin(0.5);
    statsText.setDepth(3001);

    const restartText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 150,
      'Haz clic para nueva sesión',
      {
        fontSize: '28px',
        color: '#00ff00',
        fontStyle: 'italic'
      }
    );
    restartText.setOrigin(0.5);
    restartText.setDepth(3001);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    this.input.once('pointerdown', () => {
      this.showRestartConfirmation(overlay, summaryText, statsText, restartText);
    });
  }

  private showSessionSummaryBackend(session: FinishedSessionData): void {
    this.input.setDefaultCursor('default');

    const overlay = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.8
    );
    overlay.setDepth(3000);

    const title = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 150,
      '¡SESIÓN COMPLETADA!',
      {
        fontSize: '64px',
        color: '#ffff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8
      }
    );
    title.setOrigin(0.5);
    title.setDepth(3001);

    const minutes = Math.floor(session.duration_seconds / 60);
    const seconds = session.duration_seconds % 60;

    const stats = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      `Puntuación Final: ${session.final_score}\n` +
      `Disparos Totales: ${session.total_shots}\n` +
      `Aciertos: ${session.correct_shots} | Errores: ${session.wrong_shots}\n` +
      `Precisión: ${session.accuracy}%\n` +
      `Tiempo Jugado: ${minutes}:${seconds.toString().padStart(2, '0')}`,
      {
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 10
      }
    );
    stats.setOrigin(0.5);
    stats.setDepth(3001);

    const restartText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 150,
      'Haz clic para nueva sesión',
      {
        fontSize: '28px',
        color: '#00ff00',
        fontStyle: 'italic'
      }
    );
    restartText.setOrigin(0.5);
    restartText.setDepth(3001);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    this.input.once('pointerdown', () => {
      this.showRestartConfirmation(overlay, title, stats, restartText);
    });
  }

  private showRestartConfirmation(
    _overlay: Phaser.GameObjects.Rectangle,
    summaryText: Phaser.GameObjects.Text,
    statsText: Phaser.GameObjects.Text,
    restartText: Phaser.GameObjects.Text
  ): void {
    summaryText.destroy();
    statsText.destroy();
    restartText.destroy();

    const confirmText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 60,
      '¿Seguro que deseas iniciar\nuna nueva sesión?',
      {
        fontSize: '48px',
        color: '#ffff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center'
      }
    );
    confirmText.setOrigin(0.5);
    confirmText.setDepth(3001);

    const yesButton = this.add.text(
      this.cameras.main.centerX - 100,
      this.cameras.main.centerY + 80,
      'SÍ',
      {
        fontSize: '42px',
        color: '#00ff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        backgroundColor: '#004400',
        padding: { x: 30, y: 15 }
      }
    );
    yesButton.setOrigin(0.5);
    yesButton.setDepth(3001);
    yesButton.setInteractive({ useHandCursor: true });

    const noButton = this.add.text(
      this.cameras.main.centerX + 100,
      this.cameras.main.centerY + 80,
      'NO',
      {
        fontSize: '42px',
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        backgroundColor: '#440000',
        padding: { x: 30, y: 15 }
      }
    );
    noButton.setOrigin(0.5);
    noButton.setDepth(3001);
    noButton.setInteractive({ useHandCursor: true });

    yesButton.on('pointerover', () => {
      yesButton.setScale(1.1);
    });
    yesButton.on('pointerout', () => {
      yesButton.setScale(1);
    });

    noButton.on('pointerover', () => {
      noButton.setScale(1.1);
    });
    noButton.on('pointerout', () => {
      noButton.setScale(1);
    });

    // Evita que un doble clic dispare dos veces scene.restart() (crearía
    // dos sesiones en el backend, dejando una huérfana sin disparos).
    let choiceMade = false;

    yesButton.on('pointerdown', () => {
      if (choiceMade) return;
      choiceMade = true;
      yesButton.disableInteractive();
      noButton.disableInteractive();

      this.scene.restart();
    });

    noButton.on('pointerdown', () => {
      if (choiceMade) return;
      choiceMade = true;
      yesButton.disableInteractive();
      noButton.disableInteractive();

      confirmText.destroy();
      yesButton.destroy();
      noButton.destroy();

      this.showSessionSummary();
    });
  }
}
