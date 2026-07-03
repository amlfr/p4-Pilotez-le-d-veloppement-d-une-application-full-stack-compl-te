# Documentation de maintenance — DataShare

## 1. Scripts de déploiement / installation

### Prérequis

- Java 21, Maven (wrapper fourni), Node.js + npm, PostgreSQL 18.

### Base de données

```sql
CREATE DATABASE datashare;
-- utilisateur/mot de passe : voir application.properties
```

Le schéma est créé automatiquement (`spring.jpa.hibernate.ddl-auto=update`).

### Lancement

```bash
# Backend
cd Code/backend/datashare-backend && ./mvnw.cmd spring-boot:run

# Frontend
cd Code/FE/frontend && npm install && npm run dev
```

### Configuration sensible (à externaliser en production)

- `JWT_SECRET` (variable d'environnement)
- Identifiants PostgreSQL
- `datashare.storage.location`, `datashare.base-url`

## 2. Procédures de mise à jour des dépendances

### Backend (Maven)

```bash
cd Code/backend/datashare-backend
./mvnw.cmd versions:display-dependency-updates   # lister les mises à jour
./mvnw.cmd versions:use-latest-releases          # appliquer (à vérifier)
./mvnw.cmd test                                  # valider après mise à jour
```

### Frontend (npm)

```bash
cd Code/FE/frontend
npm outdated            # lister les paquets obsolètes
npm update              # mises à jour mineures/patch (semver)
npm install <pkg>@latest  # montée de version majeure ciblée
npm run build && npm run test   # valider après mise à jour
```

## 2.1 Fréquence recommandée

| Type de mise à jour            | Fréquence                |
| ------------------------------ | ------------------------ |
| Correctifs de sécurité (audit) | Dès publication          |
| Patch / mineures               | Mensuelle                |
| Majeures (framework, lib)      | Trimestrielle, planifiée |

## 3. Risques et précautions

| Mise à jour            | Risque principal                      | Précaution                        |
| ---------------------- | ------------------------------------- | --------------------------------- |
| Spring Boot (majeure)  | Ruptures de configuration / API       | Lire les notes de version, tester |
| React / Vite (majeure) | Ruptures d'API, plugins incompatibles | Branche dédiée, tests E2E         |
| Dépendances sécurité   | Régression fonctionnelle              | Tests avant merge                 |

> Toujours mettre à jour sur une **branche dédiée**, exécuter la suite de tests,
> puis fusionner. Ne jamais mettre à jour directement sur la branche principale.
