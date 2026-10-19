import { stubAdminApi } from '../support/api';
import { adminSessionRow, adminUser, adminUsers } from '../support/fixtures';
import {
  adminFilterBar,
  clickAdminUserRow,
  clickSceneText,
  expectNoSceneText,
  expectSceneText,
  expectSnapshot,
  expectTextColor,
  getScene,
  openAdminFromMenu,
  textsOf,
  visitApp,
  waitForScene,
} from '../support/gameDriver';

const sessions = (count: number) => Array.from({ length: count }, (_, i) => adminSessionRow(i + 1));

/** Abre el panel, espera la lista y entra a las sesiones del primer usuario (id 1). */
function openUserSessions(options: Partial<Parameters<typeof stubAdminApi>[0]> = {}) {
  stubAdminApi({
    users: [adminUser({ id: 1, email: 'ana.perez@cevu.edu.co', name: 'Ana', lastname: 'Pérez', group: '10A2026' })],
    defaultSessions: sessions(9),
    ...options,
  });
  visitApp({ profile: 'admin' });
  openAdminFromMenu();
  expectSceneText('AdminScene', 'Mostrando 1-1 de 1 usuarios');
  clickAdminUserRow(0);
  expectSceneText('AdminScene', '← Volver a Usuarios');
}

const bar = () => cy.get('#admin-filters');
const dateInputs = () => bar().find('input[type="date"]');

describe('Panel de administración: sesiones de un usuario', () => {
  describe('entrar a la vista', () => {
    it('al pulsar una fila pide las sesiones de ese usuario, página 1', () => {
      openUserSessions();

      cy.wait('@getUserSessions').then(({ request }) => {
        expect(new URL(request.url).pathname).to.match(/\/api\/admin\/users\/1\/sessions$/);
        expect(request.query).to.deep.equal({ page: '1' });
      });
    });

    it('muestra el nombre, el correo con el grupo, y los botones', () => {
      openUserSessions();

      expectSceneText('AdminScene', 'Ana Pérez');
      expectSceneText('AdminScene', 'ana.perez@cevu.edu.co | Grupo: 10A2026');
      expectSceneText('AdminScene', '← Volver a Usuarios');
      expectSceneText('AdminScene', '📥 Exportar');
    });

    it('si el usuario no tiene nombre muestra su correo; si no tiene grupo, "N/A"', () => {
      openUserSessions({
        users: [adminUser({ id: 1, email: 'sin.nombre@cevu.edu.co', name: null, lastname: null, group: null })],
      });

      expectSceneText('AdminScene', 'sin.nombre@cevu.edu.co');
      expectSceneText('AdminScene', 'sin.nombre@cevu.edu.co | Grupo: N/A');
    });

    it('muestra la barra de resumen con el desglose por modo que envía el backend', () => {
      openUserSessions();

      expectSceneText(
        'AdminScene',
        'Total: 9 sesiones válidas | Promedio: 1100 pts | Mejor: 1850 pts | Tiempo jugado: 45 min\n' +
          'Razones: 5 válidos | Triángulo: 4 válidos'
      );
    });

    it('muestra el contador y los encabezados de la tabla', () => {
      openUserSessions();

      expectSceneText('AdminScene', 'Mostrando 1-9 de 9 sesiones');
      for (const header of ['#', 'Fecha', 'Hora', 'Puntuación', 'Modo', 'Disparos', 'Aciertos', 'Precisión']) {
        expectSceneText('AdminScene', header);
      }
    });

    it('si las sesiones no cargan muestra el error y "Cerrar" vuelve al menú', () => {
      openUserSessions();
      // Se prepara el fallo antes de la siguiente carga: volver a la lista y entrar de nuevo.
      cy.intercept({ method: 'GET', pathname: '/api/admin/users/*/sessions' }, {
        statusCode: 500, body: { error: 'No se pudieron leer las sesiones' },
      });
      clickSceneText('AdminScene', '← Volver a Usuarios');
      expectSceneText('AdminScene', 'Mostrando 1-1 de 1 usuarios');

      clickAdminUserRow(0);

      expectSceneText('AdminScene', 'Request failed with status code 500');
      clickSceneText('AdminScene', 'Cerrar');
      waitForScene('MenuScene');
    });
  });

  describe('filas', () => {
    it('cada fila muestra número, fecha, hora, puntuación, modo, disparos, aciertos y precisión', () => {
      openUserSessions({
        defaultSessions: [
          adminSessionRow(1, { final_score: 1850, game_mode: 'ratio_identification', total_shots: 50, correct_shots: 40, accuracy: 82 }),
          adminSessionRow(2, { final_score: 1700, game_mode: 'triangle_application', total_shots: 44, correct_shots: 33, accuracy: 75 }),
        ],
      });

      expectSceneText('AdminScene', /^\d{2}\/\d{2}\/\d{4}$/);
      expectSceneText('AdminScene', /^\d{2}:\d{2}$/);
      expectSceneText('AdminScene', '1850');
      expectSceneText('AdminScene', 'Razones');
      expectSceneText('AdminScene', '50');
      expectSceneText('AdminScene', '40');
      expectSceneText('AdminScene', '82%');
      expectSceneText('AdminScene', '1700');
      expectSceneText('AdminScene', 'Triángulo');
      expectSceneText('AdminScene', '44');
      expectSceneText('AdminScene', '33');
      expectSceneText('AdminScene', '75%');
    });

    it('la precisión es verde desde 80, naranja desde 60 y roja por debajo', () => {
      openUserSessions({
        defaultSessions: [
          adminSessionRow(1, { accuracy: 80 }),
          adminSessionRow(2, { accuracy: 79.99 }),
          adminSessionRow(3, { accuracy: 60 }),
          adminSessionRow(4, { accuracy: 59.9 }),
        ],
      });

      expectTextColor('AdminScene', '80%', '#00ff00');
      expectTextColor('AdminScene', '79.99%', '#ffaa00');
      expectTextColor('AdminScene', '60%', '#ffaa00');
      expectTextColor('AdminScene', '59.9%', '#ff6666');
    });

    it('(comportamiento actual) solo se dibujan 7 filas por página aunque el backend envíe 10', () => {
      openUserSessions({ defaultSessions: sessions(25), sessionsPerPage: 10 });
      expectSceneText('AdminScene', 'Mostrando 1-10 de 25 sesiones');

      cy.window().should((win) => {
        const modes = textsOf(getScene(win, 'AdminScene')).filter((t) => t === 'Razones' || t === 'Triángulo');
        expect(modes).to.have.length(7);
      });
    });
  });

  describe('filtros por fecha (HTML)', () => {
    it('muestra la etiqueta, dos fechas vacías y los botones Aplicar y Limpiar', () => {
      openUserSessions();

      bar().should('contain.text', 'Filtrar por fecha:');
      dateInputs().should('have.length', 2).each(($i) => expect($i.val()).to.equal(''));
      bar().contains('button', 'Aplicar');
      bar().contains('button', '✕ Limpiar');
    });

    it('"Aplicar" pide las sesiones con date_from y date_to, página 1', () => {
      openUserSessions();
      cy.wait('@getUserSessions');

      dateInputs().eq(0).type('2026-02-01');
      dateInputs().eq(1).type('2026-02-28');
      bar().contains('button', 'Aplicar').click();

      cy.wait('@getUserSessions').its('request.query').should('deep.equal', {
        page: '1', date_from: '2026-02-01', date_to: '2026-02-28',
      });
    });

    it('"Limpiar" quita las fechas', () => {
      openUserSessions();
      cy.wait('@getUserSessions');
      dateInputs().eq(0).type('2026-02-01');
      bar().contains('button', 'Aplicar').click();
      cy.wait('@getUserSessions');

      bar().contains('button', '✕ Limpiar').click();

      cy.wait('@getUserSessions').its('request.query').should('deep.equal', { page: '1' });
    });
  });

  describe('paginación', () => {
    it('con varias páginas muestra "Página x de y" y navega pidiendo cada una', () => {
      openUserSessions({ defaultSessions: sessions(25), sessionsPerPage: 10 });
      cy.wait('@getUserSessions');
      expectSceneText('AdminScene', 'Página 1 de 3');
      expectNoSceneText('AdminScene', '← Anterior');

      clickSceneText('AdminScene', 'Siguiente →');

      cy.wait('@getUserSessions').its('request.query.page').should('equal', '2');
      expectSceneText('AdminScene', 'Página 2 de 3');
      expectSceneText('AdminScene', 'Mostrando 11-20 de 25 sesiones');
      expectSceneText('AdminScene', '← Anterior');
    });

    it('se conserva el filtro de fechas al cambiar de página', () => {
      openUserSessions({ defaultSessions: sessions(25), sessionsPerPage: 10 });
      cy.wait('@getUserSessions');
      dateInputs().eq(0).type('2026-02-01');
      bar().contains('button', 'Aplicar').click();
      cy.wait('@getUserSessions');

      clickSceneText('AdminScene', 'Siguiente →');

      cy.wait('@getUserSessions').its('request.query').should('deep.include', { page: '2', date_from: '2026-02-01' });
    });
  });

  describe('navegación y exportación', () => {
    it('"← Volver a Usuarios" regresa a la lista y la pide de nuevo', () => {
      openUserSessions();
      cy.wait('@getUsers');

      clickSceneText('AdminScene', '← Volver a Usuarios');

      cy.wait('@getUsers');
      expectSceneText('AdminScene', 'Mostrando 1-1 de 1 usuarios');
      expectNoSceneText('AdminScene', '← Volver a Usuarios');
    });

    it('al volver a la lista se conservan el orden y los filtros elegidos', () => {
      stubAdminApi({ users: adminUsers(5), defaultSessions: sessions(3) });
      visitApp({ profile: 'admin' });
      openAdminFromMenu();
      expectSceneText('AdminScene', 'estudiante1@cevu.edu.co');
      clickSceneText('AdminScene', 'Email');
      expectSceneText('AdminScene', 'Email ▼');
      clickAdminUserRow(0);
      expectSceneText('AdminScene', '← Volver a Usuarios');

      clickSceneText('AdminScene', '← Volver a Usuarios');

      cy.get('@getUsers.all').its('length').should('be.gte', 3);
      cy.get('@getUsers').its('request.query').should('deep.include', { sort_by: 'email', order: 'desc' });
      expectSceneText('AdminScene', 'Email ▼');
    });

    it('"Exportar" pide el CSV del usuario con el filtro de fechas actual', () => {
      openUserSessions();
      cy.wait('@getUserSessions');
      dateInputs().eq(0).type('2026-02-01');
      bar().contains('button', 'Aplicar').click();
      cy.wait('@getUserSessions');

      clickSceneText('AdminScene', '📥 Exportar');

      cy.wait('@exportUserSessions').then(({ request }) => {
        expect(new URL(request.url).pathname).to.match(/\/api\/admin\/export\/users\/1\/sessions$/);
        expect(request.query).to.deep.include({ date_from: '2026-02-01' });
      });
    });
  });

  describe('instantáneas de la escena', () => {
    it('sesiones de un usuario', () => {
      openUserSessions({
        users: [adminUser({ id: 1, email: 'ana.perez@cevu.edu.co', name: 'Ana', lastname: 'Pérez', group: '10A2026' })],
        defaultSessions: sessions(25),
        sessionsPerPage: 10,
      });
      expectSceneText('AdminScene', 'Página 1 de 3');
      bar();

      expectSnapshot('admin-sesiones', { scene: 'AdminScene', dom: adminFilterBar });
    });
  });
});
