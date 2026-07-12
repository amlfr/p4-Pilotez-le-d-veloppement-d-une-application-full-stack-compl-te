/// <reference types="cypress" />

/**
 * Scénario 3 (US05 + US06) : Mes fichiers — le fichier téléversé apparaît
 * dans l'historique, sa suppression le fait disparaître de la liste.
 */
describe('Mes fichiers : suppression', () => {
  it("supprime un fichier et le voit disparaître de l'historique", () => {
    cy.registerNewUser();
    cy.uploadTextFile('a-supprimer-e2e.txt');

    cy.visit('/files');
    cy.contains('li', 'a-supprimer-e2e.txt').within(() => {
      cy.contains('button', 'Supprimer').click();
    });

    cy.contains('a-supprimer-e2e.txt').should('not.exist');
    // Compte tout neuf : après suppression de son unique fichier, la liste est vide.
    cy.contains('Aucun fichier pour le moment');
  });
});
