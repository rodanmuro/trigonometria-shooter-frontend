import { stubAdminApi } from '../support/api';
import { adminUsers } from '../support/fixtures';
import {
  clickSceneText,
  expectSceneText,
  openAdminFromMenu,
  pickedFile,
  stubFilePicker,
  visitApp,
} from '../support/gameDriver';

function openAdmin(options: Partial<Parameters<typeof stubAdminApi>[0]> = {}) {
  stubAdminApi({ users: adminUsers(3), ...options });
  visitApp({ profile: 'admin' });
  openAdminFromMenu();
  expectSceneText('AdminScene', 'Mostrando 1-3 de 3 usuarios');
}

describe('Panel de administración: CSV y exportación', () => {
  describe('cargar usuarios desde CSV', () => {
    const csv = 'email,group,name,lastname\nana@cevu.edu.co,10A2026,Ana,Pérez\n';

    it('abre un selector que solo admite archivos .csv', () => {
      openAdmin();
      stubFilePicker({ name: 'usuarios.csv', content: csv });

      clickSceneText('AdminScene', '📄 Cargar CSV');

      cy.wait('@uploadCsv');
      cy.window().should((win) => {
        expect(pickedFile(win)).to.deep.equal({ accept: '.csv', type: 'file' });
      });
    });

    it('envía el archivo como multipart con el token de administrador', () => {
      stubAdminApi({ users: adminUsers(3) });
      const { token } = visitApp({ profile: 'admin' });
      openAdminFromMenu();
      expectSceneText('AdminScene', 'Mostrando 1-3 de 3 usuarios');
      stubFilePicker({ name: 'usuarios.csv', content: csv });

      clickSceneText('AdminScene', '📄 Cargar CSV');

      cy.wait('@uploadCsv').then(({ request }) => {
        expect(request.headers['content-type']).to.match(/^multipart\/form-data; boundary=/);
        expect(request.headers.authorization).to.equal(`Bearer ${token}`);
        expect(String(request.body)).to.contain('name="file"; filename="usuarios.csv"');
        expect(String(request.body)).to.contain('ana@cevu.edu.co,10A2026,Ana,Pérez');
      });
    });

    it('muestra el resultado en un aviso y recarga la lista', () => {
      const alerts: string[] = [];
      cy.on('window:alert', (message) => alerts.push(message));
      openAdmin();
      cy.wait('@getUsers');
      stubFilePicker({ name: 'usuarios.csv', content: csv });

      clickSceneText('AdminScene', '📄 Cargar CSV');

      cy.wait('@uploadCsv');
      cy.wait('@getUsers');
      cy.wrap(alerts).should('deep.equal', [
        'Carga completada:\n- Creados: 2\n- Actualizados: 1\n- Errores: 1\n\nDetalles:\nFila 5: Email inválido (invalid@)',
      ]);
    });

    it('si no hay errores, el aviso no incluye "Detalles"', () => {
      const alerts: string[] = [];
      cy.on('window:alert', (message) => alerts.push(message));
      openAdmin();
      cy.intercept({ method: 'POST', pathname: '/api/admin/users/upload-csv' }, {
        body: { success: true, message: 'ok', stats: { created: 3, updated: 0, errors: 0 }, error_details: [] },
      }).as('uploadCsv');
      stubFilePicker({ name: 'usuarios.csv', content: csv });

      clickSceneText('AdminScene', '📄 Cargar CSV');

      cy.wait('@uploadCsv');
      cy.wrap(alerts).should('deep.equal', ['Carga completada:\n- Creados: 3\n- Actualizados: 0\n- Errores: 0\n\n']);
    });

    it('si el servidor lo rechaza, avisa con su mensaje (error: message) y no recarga la lista', () => {
      const alerts: string[] = [];
      cy.on('window:alert', (message) => alerts.push(message));
      openAdmin();
      cy.wait('@getUsers');
      cy.intercept({ method: 'POST', pathname: '/api/admin/users/upload-csv' }, {
        statusCode: 422, body: { error: 'CSV inválido', message: 'Falta la columna group' },
      }).as('uploadCsv');
      stubFilePicker({ name: 'usuarios.csv', content: 'email\nana@cevu.edu.co\n' });

      clickSceneText('AdminScene', '📄 Cargar CSV');

      cy.wait('@uploadCsv');
      cy.wrap(alerts).should('deep.equal', ['Error: CSV inválido: Falta la columna group']);
      cy.get('@getUsers.all').should('have.length', 1);
    });
  });

  describe('exportar usuarios', () => {
    it('pide el CSV con los filtros actuales', () => {
      openAdmin();
      cy.wait('@getUsers');
      cy.get('#admin-filters select').eq(0).select('10B2026');
      cy.wait('@getUsers');

      clickSceneText('AdminScene', '📥 Exportar');

      cy.wait('@exportUsers').then(({ request }) => {
        expect(new URL(request.url).pathname).to.match(/\/api\/admin\/export\/users$/);
        expect(request.query).to.deep.include({ group: '10B2026', sort_by: 'created_at', order: 'desc' });
      });
    });

    it('descarga el archivo con el nombre que indica el servidor', () => {
      openAdmin();

      clickSceneText('AdminScene', '📥 Exportar');

      cy.wait('@exportUsers');
      cy.readFile(`${Cypress.config('downloadsFolder')}/usuarios_prueba.csv`, { timeout: 10000 }).should(
        'contain',
        'email,group'
      );
    });

    it('si falla, avisa con un alert', () => {
      const alerts: string[] = [];
      cy.on('window:alert', (message) => alerts.push(message));
      openAdmin();
      cy.intercept({ method: 'GET', pathname: '/api/admin/export/users' }, { statusCode: 500, body: {} }).as(
        'exportUsers'
      );

      clickSceneText('AdminScene', '📥 Exportar');

      cy.wait('@exportUsers');
      // Sin mensaje en el cuerpo queda el genérico de axios
      cy.wrap(alerts).should('deep.equal', ['Error al exportar: Request failed with status code 500']);
    });

    it('si falla con un mensaje del servidor (llega como Blob), el alert lo muestra', () => {
      const alerts: string[] = [];
      cy.on('window:alert', (message) => alerts.push(message));
      openAdmin();
      cy.intercept({ method: 'GET', pathname: '/api/admin/export/users' }, {
        statusCode: 500, body: { success: false, error: 'No se pudo generar el archivo' },
      }).as('exportUsers');

      clickSceneText('AdminScene', '📥 Exportar');

      cy.wait('@exportUsers');
      cy.wrap(alerts).should('deep.equal', ['Error al exportar: No se pudo generar el archivo']);
    });
  });
});
