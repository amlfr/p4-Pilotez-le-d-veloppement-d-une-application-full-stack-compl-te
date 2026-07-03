# Garanties de sécurité — DataShare

## 1. Scan de sécurité des dépendances

**Frontend (npm) :**

```bash
cd Code/FE/frontend
npm audit                       # rapport lisible
npm audit --json > audit.json   # rapport exploitable
```

**Backend (Maven / OWASP Dependency-Check) :**

```bash
cd Code/backend/datashare-backend
./mvnw.cmd org.owasp:dependency-check-maven:check
# Rapport : target/dependency-check-report.html
```

## 2. Résultats du scan

| Source       | Critiques | Élevées | Moyennes | Faibles | Date          |
| ------------ | --------- | ------- | -------- | ------- | ------------- |
| `npm audit`  | \_        | \_      | \_       | \_      | _À compléter_ |
| OWASP (back) | \_        | \_      | \_       | \_      | _À compléter_ |

## 3. Analyse succincte des résultats

_À compléter :_ pour chaque vulnérabilité notable — est-elle exploitable dans
notre contexte ? Correctif disponible (montée de version) ? Décision (corriger /
accepter le risque / surveiller) ?

## 4. Décisions de sécurité (déjà en place dans le code)

| Domaine                  | Décision                                                           |
| ------------------------ | ------------------------------------------------------------------ |
| Authentification         | JWT stateless (Auth0 java-jwt, HS256), `/api/auth/**` public       |
| Mots de passe (comptes)  | Hachés BCrypt, minimum 8 caractères                                |
| Mots de passe (fichiers) | Hachés BCrypt, non réversibles, minimum 6 caractères (US09)        |
| Tokens de téléchargement | UUID non prédictibles, découplés du nom de fichier                 |
| Traversée de chemin      | Nom de stockage = UUID ; garde `target.startsWith(root)`           |
| Validation des entrées   | Côté client **et** serveur (taille, extension, durée, mdp)         |
| Types de fichiers        | Liste noire d'exécutables (.exe .bat .sh .ps1 .msi .dll .vbs .cmd) |
| Réponses d'erreur        | `ErrorResponse` normalisé ; 401 explicite (entry point JSON)       |
| CSRF                     | Désactivé (API stateless, pas de session/cookie)                   |
| Expiration               | Purge quotidienne + accès refusé (410) après expiration (US10)     |
