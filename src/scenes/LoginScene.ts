import Phaser from 'phaser';
import { AuthManager } from '../managers/AuthManager';
import type { GoogleCredentialResponse } from '../types/auth';
import { authApiService } from '../services/authApiService';
import { COLOR, FONT_SIZE } from '../ui/theme';

/**
 * Escena de login con Google OAuth
 */
export class LoginScene extends Phaser.Scene {
  private authManager!: AuthManager;
  private loginButton!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'LoginScene' });
  }

  create(): void {
    this.authManager = AuthManager.getInstance();

    this.cameras.main.setBackgroundColor(COLOR.navy);

    const title = this.add.text(
      this.cameras.main.centerX,
      150,
      'TRIGONOMETRIA\nSHOOTER',
      {
        fontSize: FONT_SIZE.logo,
        color: COLOR.yellow,
        fontStyle: 'bold',
        stroke: COLOR.black,
        strokeThickness: 8,
        align: 'center'
      }
    );
    title.setOrigin(0.5);

    const subtitle = this.add.text(
      this.cameras.main.centerX,
      280,
      'Aprende las razones trigonométricas jugando',
      {
        fontSize: FONT_SIZE.xxl,
        color: COLOR.white,
        fontStyle: 'italic'
      }
    );
    subtitle.setOrigin(0.5);

    const instructions = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
      'Inicia sesión con tu cuenta de Google\npara guardar tu progreso',
      {
        fontSize: FONT_SIZE.xl,
        color: COLOR.grayPale,
        align: 'center',
        lineSpacing: 10
      }
    );
    instructions.setOrigin(0.5);

    this.createGoogleButton();

    const loadingText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.height - 100,
      'Cargando Google Sign-In...',
      {
        fontSize: FONT_SIZE.md,
        color: COLOR.grayMid
      }
    );
    loadingText.setOrigin(0.5);
    loadingText.setAlpha(0);

    this.time.delayedCall(500, () => {
      loadingText.setAlpha(1);
      this.initializeGoogleSignIn(loadingText);
    });

    const credits = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.height - 30,
      'Desarrollado con Phaser 3 & TypeScript',
      {
        fontSize: FONT_SIZE.sm,
        color: '#666666'
      }
    );
    credits.setOrigin(0.5);
  }

  /**
   * Crea el botón visual de Google
   */
  private createGoogleButton(): void {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY + 80;

    this.loginButton = this.add.container(centerX, centerY);

    const buttonBg = this.add.rectangle(0, 0, 280, 60, 0xffffff);
    buttonBg.setStrokeStyle(2, 0x4285f4);

    const iconBg = this.add.circle(-90, 0, 18, 0xffffff);
    const googleIcon = this.add.text(-90, 0, 'G', {
      fontSize: FONT_SIZE.xxl,
      color: '#4285f4',
      fontStyle: 'bold'
    });
    googleIcon.setOrigin(0.5);

    const buttonText = this.add.text(10, 0, 'Sign in with Google', {
      fontSize: FONT_SIZE.lg,
      color: '#757575',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5);

    this.loginButton.add([buttonBg, iconBg, googleIcon, buttonText]);

    buttonBg.setInteractive({ useHandCursor: true });

    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(0xf8f8f8);
    });

    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(0xffffff);
    });

    buttonBg.setData('googleButtonPlaceholder', true);
  }

  /**
   * Inicializa Google Identity Services
   */
  private initializeGoogleSignIn(loadingText: Phaser.GameObjects.Text): void {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID no está configurado en .env');
      loadingText.setText('Error: Client ID no configurado');
      loadingText.setColor(COLOR.red);
      return;
    }

    if (typeof window.google === 'undefined') {
      loadingText.setText('Error: Google Identity Services no cargado');
      loadingText.setColor(COLOR.red);
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: this.handleGoogleCallback.bind(this)
      });

      const buttonDiv = document.createElement('div');
      buttonDiv.id = 'google-signin-button';
      buttonDiv.style.position = 'absolute';
      buttonDiv.style.left = '50%';
      buttonDiv.style.top = '50%';
      buttonDiv.style.transform = 'translate(-50%, -50%)';
      buttonDiv.style.marginTop = '80px';
      buttonDiv.style.zIndex = '1000';

      document.body.appendChild(buttonDiv);

      window.google.accounts.id.renderButton(
        buttonDiv,
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: 280
        }
      );

      this.loginButton.setAlpha(0);

      loadingText.destroy();
    } catch (error) {
      console.error('Error al inicializar Google Sign-In:', error);
      loadingText.setText('Error al cargar Google Sign-In');
      loadingText.setColor(COLOR.red);
    }
  }

  /**
   * Callback cuando el usuario se autentica con Google
   */
  private async handleGoogleCallback(response: GoogleCredentialResponse): Promise<void> {
    console.log('Google callback received');

    try {
      const success = this.authManager.login(response.credential);

      if (!success) {
        throw new Error('Error al procesar login local');
      }

      console.log('Enviando token al backend...');
      const userData = await authApiService.verifyGoogleToken(response.credential);
      console.log('✅ Usuario registrado en backend:', userData);

      this.authManager.updateUserFromBackend(userData);

      const user = this.authManager.getUser();

      this.showWelcomeMessage(user?.name || userData.name);

      const buttonDiv = document.getElementById('google-signin-button');
      if (buttonDiv) {
        buttonDiv.remove();
      }

      this.time.delayedCall(2000, () => {
        this.scene.stop('LoginScene');
        this.scene.start('MenuScene');
      });

    } catch (error) {
      console.error('❌ Error al verificar token con backend:', error);

      const errorText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY + 200,
        'Error al conectar con el servidor.\nIntenta de nuevo.',
        {
          fontSize: FONT_SIZE.lg,
          color: COLOR.red,
          align: 'center'
        }
      );
      errorText.setOrigin(0.5);
    }
  }

  private showWelcomeMessage(userName: string): void {
    const welcome = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      `¡Bienvenido, ${userName}!`,
      {
        fontSize: FONT_SIZE.display,
        color: COLOR.green,
        fontStyle: 'bold',
        stroke: COLOR.black,
        strokeThickness: 6
      }
    );
    welcome.setOrigin(0.5);
    welcome.setAlpha(0);

    this.tweens.add({
      targets: welcome,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      ease: 'Back.easeOut'
    });
  }

  shutdown(): void {
    const buttonDiv = document.getElementById('google-signin-button');
    if (buttonDiv) {
      buttonDiv.remove();
    }
  }
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (element: HTMLElement, options: { theme: string; size: string; text: string; width: number }) => void;
          prompt: () => void;
        };
      };
    };
  }
}
