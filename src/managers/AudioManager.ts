import Phaser from 'phaser';

/**
 * Gestor centralizado de audio para el juego
 */
export class AudioManager {
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound>;
  private isMuted: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sounds = new Map();
  }

  /**
   * Registra un sonido cargado
   */
  public registerSound(key: string): void {
    const sound = this.scene.sound.add(key);
    this.sounds.set(key, sound);
  }

  /**
   * Reproduce un sonido
   */
  public play(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
    if (this.isMuted) return;

    const sound = this.sounds.get(key);
    if (sound) {
      sound.play(config);
    } else {
      // Si no está registrado, intentar reproducir directamente
      this.scene.sound.play(key, config);
    }
  }

  /**
   * Detiene un sonido
   */
  public stop(key: string): void {
    const sound = this.sounds.get(key);
    if (sound) {
      sound.stop();
    }
  }

  /**
   * Detiene todos los sonidos
   */
  public stopAll(): void {
    this.scene.sound.stopAll();
  }

  /**
   * Silencia o activa todos los sonidos
   */
  public setMute(muted: boolean): void {
    this.isMuted = muted;
    this.scene.sound.mute = muted;
  }

  /**
   * Alterna el silencio
   */
  public toggleMute(): void {
    this.setMute(!this.isMuted);
  }

  /**
   * Verifica si está silenciado
   */
  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Ajusta el volumen general
   */
  public setVolume(volume: number): void {
    this.scene.sound.volume = Phaser.Math.Clamp(volume, 0, 1);
  }

  /**
   * Destruye el gestor de audio
   */
  public destroy(): void {
    this.stopAll();
    this.sounds.clear();
  }
}
