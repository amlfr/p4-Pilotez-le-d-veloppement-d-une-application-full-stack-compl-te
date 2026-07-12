/// <reference types="cypress" />

/**
 * Scénario 1 (US01 + US02) : inscription → upload → copie du lien →
 * téléchargement via /d/{token}.
 */
describe('Parcours complet : inscription, upload, partage, téléchargement', () => {
  it('inscrit un utilisateur, téléverse un fichier et le télécharge via le lien', () => {
    cy.registerNewUser();

    cy.uploadTextFile('rapport-e2e.txt').then((link) => {
      // Le bouton copie le lien dans le presse-papiers (toléré s'il est
      // indisponible en headless — le lien affiché reste la référence).
      cy.contains('button', 'Copier le lien').click();

      cy.visit(link);
      cy.contains('Télécharger un fichier');
      cy.contains('rapport-e2e.txt');
      cy.contains('button', 'Télécharger').click();
      cy.contains('Téléchargement lancé');
    });
  });
});
