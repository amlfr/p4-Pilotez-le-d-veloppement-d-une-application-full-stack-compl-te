/// <reference types="cypress" />

// Commandes partagées. Les E2E tournent contre la vraie stack locale
// (Vite 5173 + backend 8080 + PostgreSQL).

/** Crée un compte neuf (email unique) et arrive connecté sur /files. */
Cypress.Commands.add('registerNewUser', () => {
  const email = `e2e-${Date.now()}@test.fr`;
  cy.visit('/register');
  cy.get('input[placeholder="Saisissez votre nom..."]').type('Testeur E2E');
  cy.get('input[placeholder="Saisissez votre email..."]').type(email);
  cy.get('input[placeholder="Saisissez votre mot de passe..."]').type(
    'motdepasse123',
  );
  cy.contains('button', 'Créer mon compte').click();
  cy.url().should('include', '/files');
  return cy.wrap(email);
});

/** Téléverse un petit fichier texte (rétention 1 jour), renvoie le lien /d/{token}. */
Cypress.Commands.add(
  'uploadTextFile',
  (fileName: string, options: { password?: string } = {}) => {
    cy.visit('/upload');
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from(`Contenu de test E2E — ${fileName}`),
        fileName,
        mimeType: 'text/plain',
      },
      { force: true }, // l'input est masqué derrière le bouton nuage
    );
    if (options.password) {
      cy.get('input[placeholder="Protégez votre fichier..."]').type(
        options.password,
      );
    }
    cy.get('select').select('1 jour');
    cy.contains('button', /^Téléverser$/).click();
    cy.contains('Félicitations');
    return cy
      .contains('p', '/d/')
      .invoke('text')
      .then((text) => text.trim());
  },
);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      registerNewUser(): Chainable<string>;
      uploadTextFile(
        fileName: string,
        options?: { password?: string },
      ): Chainable<string>;
    }
  }
}

export {};
