# Plan de tests — DataShare

## 1. Stratégie

- **Backend** : JUnit 5 + Mockito (unitaires), MockMvc sur H2 en mémoire (intégration).
- **Frontend** : Vitest + Testing Library (unitaires, dans `src/tests/`), Cypress (end-to-end).
- **Couverture** : objectif 70 %. Mesuré : **92 % back** (JaCoCo), **79 % front** (V8).
  Rapports HTML archivés dans `Doc/coverage/`.

## 2. Couverture par User Story

| US   | Fonctionnalité          | Back                                         | Front / E2E                   |
| ---- | ----------------------- | -------------------------------------------- | ----------------------------- |
| US01 | Upload (avec compte)    | `FileUploadValidatorTest`, `FileServiceTest` | `Upload`, `UploadForm`, e2e 1 |
| US02 | Téléchargement via lien | `FileServiceTest`, `FileApiIntegrationTest`  | `Download`, e2e 1             |
| US03 | Création de compte      | `AuthServiceTest`, `AuthApiIntegrationTest`  | `Register`, e2e 1             |
| US04 | Connexion               | `AuthServiceTest`, `JwtServiceTest`          | `Login`                       |
| US05 | Historique              | `FileServiceTest` (pagination, filtre tag)   | `MyFiles`, e2e 3              |
| US06 | Suppression             | `FileServiceTest` (403 autre propriétaire)   | `MyFiles`, e2e 3              |
| US07 | Upload anonyme          | `FileServiceTest` (owner null)               | `UploadForm`, e2e 2           |
| US08 | Tags                    | `FileServiceTest` (normalisation, doublons)  | `TagInput`, `UploadForm`      |
| US09 | Mot de passe fichier    | `FileServiceTest`, `FileApiIntegrationTest`  | `Download`, e2e 2             |
| US10 | Expiration automatique  | `FileCleanupServiceTest`                     | —                             |

Bilan : 64 tests back, 52 tests front, 3 scénarios Cypress.

## 3. Tests end-to-end (Cypress)

Trois parcours critiques, contre la vraie stack locale (backend + front + PostgreSQL démarrés) :

1. Inscription → upload → lien de partage → téléchargement via `/d/{token}`
2. Fichier protégé, en anonyme : mauvais mot de passe refusé, bon mot de passe accepté
3. Mes fichiers : suppression, le fichier disparaît de la liste

## 4. Critères d'acceptation

| Scénario                        | Résultat attendu       |
| ------------------------------- | ---------------------- |
| Upload > 1 Go                   | Rejeté (413)           |
| Extension interdite (.exe, …)   | Rejetée (415)          |
| Durée hors 1–7 jours            | Rejetée (422)          |
| Lien expiré                     | Erreur explicite (410) |
| Mot de passe < 6 caractères     | Rejeté (422)           |
| Téléchargement protégé sans mdp | Refusé (401)           |

## 5. Exécution

```bash
# Backend (unitaires + intégration, rapport JaCoCo dans target/site/jacoco)
cd Code/backend/datashare-backend
./mvnw.cmd test

# Frontend (unitaires ; `npm run coverage` pour le rapport)
cd Code/FE/frontend
npm run test

# End-to-end (stack locale démarrée)
npm run e2e         # headless
npm run e2e:open    # interactif
```
