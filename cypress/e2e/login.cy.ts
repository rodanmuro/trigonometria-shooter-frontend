import { backendUser, expectSceneText, visitApp, waitForScene } from '../support/gameDriver';
import { makeJwt } from '../../tests/helpers/jwt';

describe('Login', () => {
  describe('sin sesión', () => {
    it('muestra la pantalla de login con título y subtítulo', () => {
      visitApp({ authenticated: false, googleStub: true });

      waitForScene('LoginScene');
      expectSceneText('LoginScene', 'TRIGONOMETRIA\nSHOOTER');
      expectSceneText('LoginScene', 'Aprende las razones trigonométricas jugando');
      expectSceneText('LoginScene', 'Inicia sesión con tu cuenta de Google');
    });

    it('inicializa Google Identity Services con el Client ID y pinta su botón', () => {
      visitApp({ authenticated: false, googleStub: true });

      cy.window().should((win) => {
        const gsi = (win as any).__gsi;
        expect(gsi.initialized?.client_id).to.equal('test-client-id.apps.googleusercontent.com');
        expect(gsi.buttonRendered).to.equal(true);
      });
      cy.get('#google-signin-button').should('contain.text', 'Sign in with Google');
    });

    it('avisa si Google Identity Services no cargó', () => {
      visitApp({ authenticated: false, googleStub: false });

      expectSceneText('LoginScene', 'Error: Google Identity Services no cargado');
    });
  });

  describe('con un token guardado vencido', () => {
    it('lo descarta y muestra el login', () => {
      visitApp({ authenticated: true, tokenExpired: true, googleStub: true });

      waitForScene('LoginScene');
      cy.window().should((win) => {
        expect(win.localStorage.getItem('google_auth_token')).to.equal(null);
        expect(win.localStorage.getItem('google_user_data')).to.equal(null);
      });
    });
  });

  describe('al autenticarse con Google', () => {
    const credential = makeJwt({ name: 'Ana Pérez' });

    it('verifica el token con el backend, da la bienvenida y pasa al menú de juegos', () => {
      cy.intercept({ method: 'POST', pathname: '/api/auth/verify' }, {
        statusCode: 200,
        body: { success: true, data: backendUser('teacher') },
      }).as('verify');
      visitApp({ authenticated: false, googleStub: true });
      cy.get('#google-signin-button');

      cy.window().then((win) => (win as any).__gsi.initialized.callback({ credential }));

      cy.wait('@verify').its('request.body').should('deep.equal', { token: credential });
      expectSceneText('LoginScene', '¡Bienvenido, Ana Pérez!');
      cy.get('#google-signin-button').should('not.exist');
      waitForScene('MenuScene');
      cy.window().should((win) => {
        expect(win.localStorage.getItem('google_auth_token')).to.equal(credential);
        // El perfil que manda el backend sustituye al "student" por defecto.
        expect(JSON.parse(win.localStorage.getItem('google_user_data')!).profile).to.equal('teacher');
      });
    });

    it('si el backend falla, muestra el error y se queda en el login', () => {
      cy.intercept({ method: 'POST', pathname: '/api/auth/verify' }, {
        statusCode: 500,
        body: { success: false, error: 'boom' },
      }).as('verify');
      visitApp({ authenticated: false, googleStub: true });
      cy.get('#google-signin-button');

      cy.window().then((win) => (win as any).__gsi.initialized.callback({ credential }));

      cy.wait('@verify');
      expectSceneText('LoginScene', 'Error al conectar con el servidor.\nIntenta de nuevo.');
      waitForScene('LoginScene');
      cy.window().its('game.scene').invoke('isActive', 'MenuScene').should('equal', false);
    });

    it('rechaza un credential vencido sin llamar al backend', () => {
      const expired = makeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
      visitApp({ authenticated: false, googleStub: true });
      cy.get('#google-signin-button');

      cy.window().then((win) => (win as any).__gsi.initialized.callback({ credential: expired }));

      expectSceneText('LoginScene', 'Error al conectar con el servidor.');
      cy.get('@unstubbed.all').should('have.length', 0);
    });
  });

  describe('con sesión vigente', () => {
    it('salta el login y entra directo al menú de juegos', () => {
      visitApp();

      waitForScene('MenuScene');
      cy.get('#google-signin-button').should('not.exist');
    });
  });
});
