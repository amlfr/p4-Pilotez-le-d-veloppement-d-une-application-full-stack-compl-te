# Plan de tests — DataShare

## 1. Stratégie de test

- **Backend** : Spring Boot 4 / JUnit 5 + Mockito (tests unitaires), MockMvc
  (tests de tranche web) pour les contrôleurs.
- **Frontend** : Vitest + @testing-library/react (unitaire/intégration),
  Cypress (end-to-end).
- **Objectif de couverture** : 80 % minimum.

## 2. Tests unitaires — fonctionnalités obligatoires du MVP

Chaque User Story du MVP doit être couverte par au moins un test.

| US   | Fonctionnalité          | Test(s)                                             | Statut        |
| ---- | ----------------------- | --------------------------------------------------- | ------------- |
| US01 | Upload (avec compte)    | `FileServiceTest` (validation taille/ext/durée/mdp) | _À compléter_ |
| US02 | Téléchargement via lien | `FileControllerTest` (404 / 410 / 401 / 200)        | _À compléter_ |
| US03 | Création de compte      | `AuthServiceTest` (email unique, hash mdp)          | _À compléter_ |
| US04 | Connexion               | `AuthServiceTest` (JWT émis, 401 mauvais mdp)       | _À compléter_ |
| US05 | Historique              | `HistoryControllerTest` (pagination, propriétaire)  | _À compléter_ |
| US06 | Suppression             | `FileServiceTest` (403 autre propriétaire, 204)     | _À compléter_ |
| US10 | Expiration automatique  | `FileCleanupServiceTest` ✅ (2 tests, déjà écrits)  | Fait          |

## 3. Tests end-to-end (Cypress) — scénarios critiques

Test plan:

Tester chaque fonctionnalite par un test end to end.
Penser aux fonctionnalite anonymes
Case d'erreur avec verification des reponses backend

## 4. Critères d'acceptation

| Scénario                        | Résultat attendu       |
| ------------------------------- | ---------------------- |
| Upload > 1 Go                   | Rejeté (413)           |
| Extension interdite (.exe, …)   | Rejetée (415)          |
| Durée hors 1–7 jours            | Rejetée (422)          |
| Lien expiré                     | Erreur explicite (410) |
| Mot de passe < 6 caractères     | Rejeté (422)           |
| Téléchargement protégé sans mdp | Refusé (401)           |

## 5. Instructions d'exécution

**Backend (unitaires) :**

```bash
cd Code/backend/datashare-backend
./mvnw.cmd test                         # tous les tests
./mvnw.cmd test -Dtest=FileCleanupServiceTest   # une classe
```

**Frontend (unitaires) :**

```bash
cd Code/FE/frontend
npm run test            # Vitest
```

**End-to-end (Cypress) :**

```bash
cd Code/FE/frontend
npx cypress open        # mode interactif
npx cypress run         # mode headless / CI
```
