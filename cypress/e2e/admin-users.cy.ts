import { stubAdminApi } from '../support/api';
import { adminUser, adminUsers } from '../support/fixtures';
import {
  adminFilterBar,
  clickSceneText,
  expectNoSceneText,
  expectSceneText,
  expectSnapshot,
  getScene,
  openAdminFromMenu,
  textsOf,
  visitApp,
  waitForScene,
} from '../support/gameDriver';

const YEAR = new Date().getFullYear();

function openAdmin(options: Parameters<typeof stubAdminApi>[0]) {
  stubAdminApi(options);
  visitApp({ profile: 'admin' });
  return openAdminFromMenu();
}

const bar = () => cy.get('#admin-filters');
const dateFromInput = () => bar().find('input[type="date"]').eq(0);
const dateToInput = () => bar().find('input[type="date"]').eq(1);
const minScoreInput = () => bar().find('input[type="number"]');
const groupSelect = () => bar().find('select').eq(0);
const profileSelect = () => bar().find('select').eq(1);
const searchInput = () => bar().find('input[type="text"]');

/**
 * Fija el valor y dispara un único evento "change". Con `.type()` + `.blur()` la app puede redibujar
 * la barra entre ambos comandos y Cypress falla porque el elemento ya no está en el DOM.
 */
const setValue = (field: () => Cypress.Chainable<JQuery<HTMLElement>>, value: string) =>
  field().invoke('val', value).trigger('change');

describe('Panel de administración: lista de usuarios', () => {
  describe('carga inicial', () => {
    it('pide primero los grupos y después los usuarios', () => {
      openAdmin({ users: adminUsers(3) });

      cy.wait('@getGroups');
      cy.wait('@getUsers');
    });

    it('pide la página 1 con 14 usuarios, orden por creación descendente y filtros por defecto', () => {
      openAdmin({ users: adminUsers(3) });

      cy.wait('@getUsers').its('request.query').should('deep.equal', {
        page: '1',
        per_page: '14',
        sort_by: 'created_at',
        order: 'desc',
        date_from: `${YEAR}-01-01`,
        min_score: '1000',
      });
    });

    it('envía el token del administrador', () => {
      stubAdminApi({ users: adminUsers(1) });
      const { token } = visitApp({ profile: 'admin' });
      openAdminFromMenu();

      cy.wait('@getUsers').its('request.headers.authorization').should('equal', `Bearer ${token}`);
    });

    it('muestra el título y los botones de la cabecera', () => {
      openAdmin({ users: adminUsers(3) });

      expectSceneText('AdminScene', 'PANEL DE ADMINISTRACIÓN');
      expectSceneText('AdminScene', '← Volver al Menú');
      expectSceneText('AdminScene', '📄 Cargar CSV');
      expectSceneText('AdminScene', '📥 Exportar');
    });
  });

  describe('tabla', () => {
    it('muestra los encabezados de las ocho columnas', () => {
      openAdmin({ users: adminUsers(3) });

      for (const header of ['No', 'Email', 'Nombre', 'Grupo', 'Sesiones', 'Promedio', 'Mejor', 'Última Sesión']) {
        expectSceneText('AdminScene', header);
      }
    });

    it('cada fila muestra número, email, nombre completo, grupo, sesiones, promedio y mejor puntaje', () => {
      openAdmin({
        users: [
          adminUser({
            id: 1, email: 'ana.perez@cevu.edu.co', name: 'Ana', lastname: 'Pérez', group: '10A2026',
            game_sessions_count: 12, avg_score: 1432.56, best_score: 2100,
          }),
        ],
      });

      expectSceneText('AdminScene', '1');
      expectSceneText('AdminScene', 'ana.perez@cevu.edu.co');
      expectSceneText('AdminScene', 'Ana Pérez');
      expectSceneText('AdminScene', '10A2026');
      expectSceneText('AdminScene', '12');
      expectSceneText('AdminScene', '1432.6');
      expectSceneText('AdminScene', '2100');
    });

    // Defecto 4 de la bitácora 014 (corregido en la etapa 2 del refactor, bitácora 020): antes usaba
    // toLocaleDateString() sin idioma (3/20/2026 en inglés).
    it('la última sesión se muestra como dd/mm/aaaa, sin depender del idioma del navegador', () => {
      openAdmin({ users: [adminUser({ last_played_at: '2026-03-05T14:07:00' })] });

      expectSceneText('AdminScene', /^\d{2}\/\d{2}\/\d{4}$/);
      expectSceneText('AdminScene', '05/03/2026');
    });

    it('trunca emails de más de 28 caracteres y nombres de más de 18', () => {
      openAdmin({
        users: [
          adminUser({
            email: 'nombre.muy.largo.de.estudiante@cevu.edu.co',
            name: 'Maria Fernanda',
            lastname: 'Rodriguez Gomez',
          }),
        ],
      });

      expectSceneText('AdminScene', 'nombre.muy.largo.de.estud...');
      expectSceneText('AdminScene', 'Maria Fernanda ...');
    });

    it('un email de exactamente 28 caracteres no se trunca', () => {
      const email = 'abcdefghij.klmnopqrs@cevu.co'; // 28
      expect(email).to.have.length(28);
      openAdmin({ users: [adminUser({ email })] });

      expectSceneText('AdminScene', email);
    });

    it('usa "-" para los datos que faltan', () => {
      openAdmin({
        users: [
          adminUser({
            name: null, lastname: null, group: null, avg_score: null, best_score: null, last_played_at: null,
            game_sessions_count: 0,
          }),
        ],
      });

      cy.window().should((win) => {
        const dashes = textsOf(getScene(win, 'AdminScene')).filter((t) => t === '-');
        expect(dashes).to.have.length(5); // nombre, grupo, promedio, mejor y última sesión
      });
    });

    it('muestra el contador "Mostrando a-b de N usuarios"', () => {
      openAdmin({ users: adminUsers(30) });

      expectSceneText('AdminScene', 'Mostrando 1-14 de 30 usuarios');
    });

    it('sin usuarios, el contador es 0-0 de 0 y no hay filas', () => {
      openAdmin({ users: [] });

      expectSceneText('AdminScene', 'Mostrando 0-0 de 0 usuarios');
      expectSceneText('AdminScene', 'Página 1 de 1');
    });

    it('(comportamiento actual) con más de 14 usuarios en la respuesta solo se dibujan 14 filas', () => {
      // El stub ignora el per_page=14 que pide la escena y devuelve 20 usuarios en una sola página.
      openAdmin({ users: adminUsers(20), usersPageSize: 20 });
      expectSceneText('AdminScene', 'Mostrando 1-20 de 20 usuarios');

      cy.window().should((win) => {
        const rows = textsOf(getScene(win, 'AdminScene')).filter((t) => /^estudiante\d+@/.test(t));
        expect(rows).to.have.length(14);
      });
    });
  });

  describe('paginación', () => {
    it('muestra "Página x de y" y solo "Siguiente" en la primera página', () => {
      openAdmin({ users: adminUsers(30) });

      expectSceneText('AdminScene', 'Página 1 de 3');
      expectSceneText('AdminScene', 'Siguiente →');
      expectNoSceneText('AdminScene', '← Anterior');
    });

    it('cambiar de página pide esa página y numera las filas a partir de la siguiente', () => {
      openAdmin({ users: adminUsers(30) });
      cy.wait('@getUsers');
      expectSceneText('AdminScene', 'estudiante1@cevu.edu.co');

      clickSceneText('AdminScene', 'Siguiente →');

      cy.wait('@getUsers').its('request.query.page').should('equal', '2');
      expectSceneText('AdminScene', 'Página 2 de 3');
      expectSceneText('AdminScene', 'estudiante15@cevu.edu.co');
      expectSceneText('AdminScene', '15');
      expectNoSceneText('AdminScene', 'estudiante1@cevu.edu.co');
      expectSceneText('AdminScene', '← Anterior');
    });

    it('la última página solo tiene "Anterior"', () => {
      openAdmin({ users: adminUsers(30) });
      expectSceneText('AdminScene', 'Página 1 de 3');
      clickSceneText('AdminScene', 'Siguiente →');
      expectSceneText('AdminScene', 'Página 2 de 3');
      clickSceneText('AdminScene', 'Siguiente →');

      expectSceneText('AdminScene', 'Página 3 de 3');
      expectNoSceneText('AdminScene', 'Siguiente →');
      expectSceneText('AdminScene', '← Anterior');
    });

    it('se conservan los filtros al cambiar de página', () => {
      openAdmin({ users: adminUsers(30) });
      cy.wait('@getUsers');
      groupSelect().select('10B2026');
      cy.wait('@getUsers');

      clickSceneText('AdminScene', 'Siguiente →');

      cy.wait('@getUsers').its('request.query').should('deep.include', { group: '10B2026', page: '2' });
    });
  });

  describe('ordenamiento por columna', () => {
    beforeEach(() => {
      openAdmin({ users: adminUsers(5) });
      cy.wait('@getUsers');
    });

    it('al principio ningún encabezado muestra flecha', () => {
      expectNoSceneText('AdminScene', /[▲▼]/);
    });

    it('el primer click ordena descendente, el segundo ascendente, el tercero otra vez descendente', () => {
      clickSceneText('AdminScene', 'Email');
      cy.wait('@getUsers').its('request.query').should('deep.include', { sort_by: 'email', order: 'desc', page: '1' });
      expectSceneText('AdminScene', 'Email ▼');

      clickSceneText('AdminScene', 'Email ▼');
      cy.wait('@getUsers').its('request.query').should('deep.include', { sort_by: 'email', order: 'asc' });
      expectSceneText('AdminScene', 'Email ▲');

      clickSceneText('AdminScene', 'Email ▲');
      cy.wait('@getUsers').its('request.query').should('deep.include', { sort_by: 'email', order: 'desc' });
      expectSceneText('AdminScene', 'Email ▼');
    });

    it('cambiar de columna ordena esa columna descendente y quita la flecha de la anterior', () => {
      clickSceneText('AdminScene', 'Email');
      cy.wait('@getUsers');
      expectSceneText('AdminScene', 'Email ▼');

      clickSceneText('AdminScene', 'Sesiones');

      cy.wait('@getUsers').its('request.query').should('deep.include', { sort_by: 'sessions_count', order: 'desc' });
      expectSceneText('AdminScene', 'Sesiones ▼');
      expectNoSceneText('AdminScene', 'Email ▼');
    });

    it('se pueden ordenar Email, Nombre, Grupo, Sesiones y Promedio', () => {
      const columns: Array<[string, string]> = [
        ['Email', 'email'], ['Nombre', 'name'], ['Grupo', 'group'], ['Sesiones', 'sessions_count'], ['Promedio', 'avg_score'],
      ];
      for (const [label, field] of columns) {
        clickSceneText('AdminScene', label);
        cy.wait('@getUsers').its('request.query.sort_by').should('equal', field);
        expectSceneText('AdminScene', `${label} ▼`);
      }
    });

    it('No, Mejor y Última Sesión no son ordenables: el click no pide nada', () => {
      for (const label of ['No', 'Mejor', 'Última Sesión']) {
        clickSceneText('AdminScene', label);
      }
      cy.wait(600);

      cy.get('@getUsers.all').should('have.length', 1);
    });

    it('al ordenar se vuelve a la página 1', () => {
      cy.get('@getUsers.all').should('have.length', 1);
      clickSceneText('AdminScene', 'Nombre');

      cy.wait('@getUsers').its('request.query.page').should('equal', '1');
    });
  });

  describe('barra de filtros (HTML)', () => {
    it('muestra desde, hasta, mínimo de puntos, grupo, perfil, búsqueda y limpiar', () => {
      openAdmin({ users: adminUsers(3), groups: ['10A2026', '10B2026'] });

      bar().should('be.visible');
      dateFromInput().should('have.value', `${YEAR}-01-01`);
      dateToInput().should('have.value', '');
      minScoreInput().should('have.value', '1000').and('have.attr', 'step', '10');
      groupSelect().find('option').then(($o) => {
        expect([...$o].map((o) => o.textContent)).to.deep.equal(['Todos los grupos', '10A2026', '10B2026']);
      });
      profileSelect().find('option').then(($o) => {
        expect([...$o].map((o) => o.textContent)).to.deep.equal(['Todos los perfiles', 'Estudiante', 'Profesor', 'Admin']);
      });
      searchInput().should('have.attr', 'placeholder', '🔍 Buscar...');
      bar().contains('button', '✕ Limpiar');
    });

    it('cambiar "Desde" y "Hasta" filtra por fechas y vuelve a la página 1', () => {
      openAdmin({ users: adminUsers(30) });
      cy.wait('@getUsers');
      clickSceneText('AdminScene', 'Siguiente →');
      cy.wait('@getUsers');

      setValue(dateFromInput, '2026-02-01');
      cy.wait('@getUsers').its('request.query').should('deep.include', { date_from: '2026-02-01', page: '1' });

      setValue(dateToInput, '2026-02-28');
      cy.wait('@getUsers').its('request.query').should('deep.include', { date_from: '2026-02-01', date_to: '2026-02-28' });
    });

    it('vaciar "Desde" quita el parámetro date_from', () => {
      openAdmin({ users: adminUsers(3) });
      cy.wait('@getUsers');

      setValue(dateFromInput, '');

      cy.wait('@getUsers').its('request.query').should('not.have.property', 'date_from');
    });

    it('cambiar los puntos mínimos usa el nuevo valor; con 0 SÍ envía min_score=0', () => {
      openAdmin({ users: adminUsers(3) });
      cy.wait('@getUsers');

      setValue(minScoreInput, '1800');
      cy.wait('@getUsers').its('request.query.min_score').should('equal', '1800');

      setValue(minScoreInput, '0');
      cy.wait('@getUsers').its('request.query.min_score').should('equal', '0');
    });

    it('elegir un grupo lo envía y vuelve a la página 1; "Todos" lo quita', () => {
      openAdmin({ users: adminUsers(3) });
      cy.wait('@getUsers');

      groupSelect().select('11A2026');
      cy.wait('@getUsers').its('request.query').should('deep.include', { group: '11A2026', page: '1' });
      groupSelect().should('have.value', '11A2026');

      groupSelect().select('Todos los grupos');
      cy.wait('@getUsers').its('request.query').should('not.have.property', 'group');
    });

    it('elegir un perfil lo envía', () => {
      openAdmin({ users: adminUsers(3) });
      cy.wait('@getUsers');

      profileSelect().select('Profesor');

      cy.wait('@getUsers').its('request.query.profile').should('equal', 'teacher');
    });

    it('la búsqueda espera 400 ms y envía el texto', () => {
      openAdmin({ users: adminUsers(3) });
      cy.wait('@getUsers');

      searchInput().type('maria');

      cy.wait('@getUsers').its('request.query.search').should('equal', 'maria');
      cy.get('@getUsers.all').should('have.length', 2);
    });

    it('"✕ Limpiar" restablece filtros y orden a los valores por defecto', () => {
      openAdmin({ users: adminUsers(30) });
      cy.wait('@getUsers');
      groupSelect().select('10A2026');
      cy.wait('@getUsers');
      clickSceneText('AdminScene', 'Email');
      cy.wait('@getUsers');
      setValue(minScoreInput, '500');
      cy.wait('@getUsers');

      bar().contains('button', '✕ Limpiar').click();

      cy.wait('@getUsers').its('request.query').should('deep.equal', {
        page: '1', per_page: '14', sort_by: 'created_at', order: 'desc', date_from: `${YEAR}-01-01`, min_score: '1000',
      });
      groupSelect().should('have.value', '');
      minScoreInput().should('have.value', '1000');
      expectNoSceneText('AdminScene', /[▲▼]/);
    });
  });

  describe('errores', () => {
    // A diferencia de multiplicación (fetch), el servicio usa axios: el mensaje que se muestra es el de
    // axios ("Request failed with status code N"), no el `error` que envía el servidor.
    it('si los usuarios no cargan muestra el mensaje de axios y "Cerrar" vuelve al menú', () => {
      openAdmin({ users: [], usersFail: { statusCode: 403, body: { error: 'Acceso denegado' } } });

      expectSceneText('AdminScene', 'ERROR');
      expectSceneText('AdminScene', 'Request failed with status code 403');
      expectNoSceneText('AdminScene', 'Acceso denegado');

      clickSceneText('AdminScene', 'Cerrar');

      waitForScene('MenuScene');
    });

    it('si los grupos no cargan, la lista aparece igual y el selector solo tiene "Todos los grupos"', () => {
      openAdmin({ users: adminUsers(3), groupsFail: true });

      expectSceneText('AdminScene', 'Mostrando 1-3 de 3 usuarios');
      groupSelect().find('option').should('have.length', 1);
    });
  });

  describe('navegación', () => {
    it('"← Volver al Menú" regresa al menú y retira la barra de filtros', () => {
      openAdmin({ users: adminUsers(3) });
      bar().should('exist');

      clickSceneText('AdminScene', '← Volver al Menú');

      waitForScene('MenuScene');
      cy.get('#admin-filters').should('not.exist');
    });

    // Defecto 3 de la bitácora 014 (corregido en la etapa 4 del refactor, bitácora 022): igual que en
    // StatsScene, la barra solo se retiraba con los botones de la escena. Se cierra por el plugin de la
    // propia escena (ver el comentario de stats.cy.ts).
    it('si la escena se cierra sin pasar por sus botones, la barra de filtros se retira', () => {
      openAdmin({ users: adminUsers(3) });
      bar().should('exist');

      cy.window().then((win) => getScene(win, 'AdminScene').scene.start('MenuScene'));

      waitForScene('MenuScene');
      cy.get('#admin-filters').should('not.exist');
    });
  });

  describe('instantáneas de la escena', () => {
    const snapshotUsers = [
      adminUser({
        id: 1, email: 'ana.perez@cevu.edu.co', name: 'Ana', lastname: 'Pérez', group: '10A2026',
        game_sessions_count: 12, avg_score: 1432.56, best_score: 2100,
      }),
      adminUser({
        id: 2, email: 'nombre.muy.largo.de.estudiante@cevu.edu.co', name: 'Maria Fernanda',
        lastname: 'Rodriguez Gomez', group: '11A2026', game_sessions_count: 3, avg_score: 1000, best_score: 1100,
      }),
      adminUser({
        id: 3, email: 'sin.datos@cevu.edu.co', name: null, lastname: null, group: null,
        game_sessions_count: 0, avg_score: null, best_score: null, last_played_at: null,
      }),
    ];

    it('lista de usuarios', () => {
      openAdmin({ users: snapshotUsers });
      expectSceneText('AdminScene', 'Mostrando 1-3 de 3 usuarios');
      bar();

      expectSnapshot('admin-usuarios', { scene: 'AdminScene', dom: adminFilterBar });
    });

    it('lista de usuarios ordenada, con página siguiente', () => {
      openAdmin({ users: adminUsers(30) });
      expectSceneText('AdminScene', 'Página 1 de 3');
      clickSceneText('AdminScene', 'Email');
      cy.wait('@getUsers');
      cy.wait('@getUsers');
      expectSceneText('AdminScene', 'Email ▼');
      bar();

      expectSnapshot('admin-usuarios-ordenada', { scene: 'AdminScene', dom: adminFilterBar });
    });

    it('error', () => {
      openAdmin({ users: [], usersFail: { statusCode: 403, body: { error: 'Acceso denegado' } } });
      expectSceneText('AdminScene', 'Request failed with status code 403');

      expectSnapshot('admin-error', { scene: 'AdminScene' });
    });
  });
});
