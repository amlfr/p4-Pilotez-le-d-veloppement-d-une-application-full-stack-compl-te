/// <reference types="cypress" />

/**
 * Scénario 2 (US09 + US07) : fichier protégé par mot de passe, téléversé en
 * anonyme — mauvais mot de passe refusé, bon mot de passe télécharge.
 */
describe('Fichier protégé par mot de passe', () => {
  it('refuse un mauvais mot de passe puis télécharge avec le bon', () => {
    // Pas de connexion : l'upload anonyme (US07) est couvert au passage.
    cy.uploadTextFile('secret-e2e.txt', { password: 'sesame99' }).then(
      (link) => {
        cy.visit(link);
        cy.contains('secret-e2e.txt');

        cy.get('input[placeholder="Saisissez le mot de passe"]').type(
          'mauvais-mdp',
        );
        cy.contains('button', 'Télécharger').click();
        cy.contains('Mot de passe incorrect');

        cy.get('input[placeholder="Saisissez le mot de passe"]')
          .clear()
          .type('sesame99');
        cy.contains('button', 'Télécharger').click();
        cy.contains('Téléchargement lancé');
      },
    );
  });
});
