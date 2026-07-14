/// <reference types="cypress" />

// Scénario 1 (US01 + US02) : inscription → upload → lien → téléchargement.
describe('Parcours complet : inscription, upload, partage, téléchargement', () => {
  it('inscrit un utilisateur, téléverse un fichier et le télécharge via le lien', () => {
    cy.registerNewUser();

    cy.uploadTextFile('rapport-e2e.txt').then((link) => {
      cy.contains('button', 'Copier le lien').click();

      cy.visit(link);
      cy.contains('Télécharger un fichier');
      cy.contains('rapport-e2e.txt');
      cy.contains('button', 'Télécharger').click();
      cy.contains('Téléchargement lancé');
    });
  });
});
