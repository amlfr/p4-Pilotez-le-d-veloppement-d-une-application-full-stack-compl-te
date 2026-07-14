# Documentation de maintenance — DataShare

## 1. Scripts de déploiement / installation

### Prérequis

- Java 21, Maven (wrapper fourni), Node.js + npm, PostgreSQL 18.

### Base de données

Le schéma se crée à la main, via les scripts de `Code/backend/datashare-backend/db/`
(identifiants : voir `application.properties`) :

```bash
cd Code/backend/datashare-backend
psql -U postgres -f db/01-create-database.sql          # crée la base
psql -U postgres -d datashare -f db/02-schema.sql      # crée les tables
```

L'application tourne en `ddl-auto=validate` : si le schéma ne colle pas aux
entités, elle refuse de démarrer. Une évolution du modèle = un script SQL dans
`db/` + l'entité correspondante.

### Lancement

```bash
# Backend (au premier lancement : cp .env.example .env puis remplir DB_PASSWORD)
cd Code/backend/datashare-backend && ./mvnw.cmd spring-boot:run

# Frontend
cd Code/FE/frontend && npm install && npm run dev
```

### Configuration sensible (variables d'environnement, jamais commitées)

- `DB_PASSWORD` (obligatoire), `DB_USERNAME`, `DB_URL` — identifiants PostgreSQL
- `JWT_SECRET` — clé de signature JWT (32 caractères minimum en production)
- `datashare.storage.location`, `datashare.base-url` — à adapter hors local

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
