/// <reference types="cypress" />

// Scénario 3 (US05 + US06) : suppression depuis l'historique.
describe('Mes fichiers : suppression', () => {
  it("supprime un fichier et le voit disparaître de l'historique", () => {
    cy.registerNewUser();
    cy.uploadTextFile('a-supprimer-e2e.txt');

    cy.visit('/files');
    cy.contains('li', 'a-supprimer-e2e.txt').within(() => {
      cy.contains('button', 'Supprimer').click();
    });

    cy.contains('a-supprimer-e2e.txt').should('not.exist');
    // Compte neuf, un seul fichier : la liste doit repasser à vide.
    cy.contains('Aucun fichier pour le moment');
  });
});
