# Suivi de performance — DataShare

## 1. Endpoints critiques testés

- **`POST /api/files` (upload)** — le plus coûteux : écriture disque + insertion en base.
- **`GET /api/files/{token}/download`** — le plus sollicité : c'est le lien public partagé.

## 2. Tests de performance (k6)

Scripts dans `perf/` : [`k6-download.js`](perf/k6-download.js) et
[`k6-upload.js`](perf/k6-upload.js) (payload : `sample.bin`, 10 Ko).

Exécution (backend démarré, PostgreSQL local) :

```bash
cd Code/perf
# download : nécessite le token d'un fichier non expiré, sans mot de passe
k6 run -e TOKEN=<download_token> k6-download.js
# upload : anonyme (US07), les fichiers créés expirent en 1 jour (purge US10)
k6 run k6-upload.js
```

Les deux scripts embarquent des **seuils** qui font échouer le run s'ils sont
dépassés : taux d'erreur HTTP < 1 % et p95 < 500 ms.

## 3. Résultats et interprétation

Mesures du 2026-07-05, machine de dev (Windows 11, backend Spring Boot local,
PostgreSQL 18 local, fichier de 100 Ko pour le download / 10 Ko pour l'upload).
Sorties complètes : `perf/k6-download-results.txt` et `perf/k6-upload-results.txt`.

### Download — 20 utilisateurs virtuels, 55 s

| Métrique         | Valeur                    |
| ---------------- | ------------------------- |
| Requêtes/s (RPS) | **2 322 req/s** (127 733 requêtes) |
| Latence p95      | **7,5 ms**                |
| Latence moyenne  | **3,0 ms** (méd. 2,1 ms, max 104 ms) |
| Taux d'erreur    | **0 %** (0 / 127 733)     |
| Débit sortant    | 239 Mo/s (13 Go servis)   |

### Upload — 10 utilisateurs virtuels, 35 s

| Métrique         | Valeur                    |
| ---------------- | ------------------------- |
| Requêtes/s (RPS) | **601 req/s** (21 055 uploads) |
| Latence p95      | **17,3 ms**               |
| Latence moyenne  | **12,8 ms** (méd. 8,5 ms, max 1,01 s) |
| Taux d'erreur    | **0 %** (0 / 21 055)      |

**Interprétation.** Les seuils sont passés avec un ordre de grandeur de marge,
zéro erreur. L'upload est ~4× plus lent que le download, logique (écriture
disque + INSERT) ; son max isolé à ~1 s reste ponctuel vu le p95 à 17 ms.
Mesures prises avec `show-sql=true`, donc plutôt pessimistes — en production
c'est le réseau qui saturerait bien avant l'applicatif.

## 4. Budget de performance côté front

| Indicateur                 | Budget visé | Mesuré        |
| -------------------------- | ----------- | ------------- |
| Taille du bundle JS (gzip) | < 250 Ko    | _À compléter_ |
| First Contentful Paint     | < 1,5 s     | _À compléter_ |
| Lighthouse — Performance   | ≥ 90        | _À compléter_ |

Mesures :

```bash
cd Code/FE/frontend
npm run build        # affiche la taille des chunks (Vite/Rollup)
# + Lighthouse (DevTools Chrome) sur le build de production
```

## 5. Métriques suivies

- Temps de réponse back : voir §3 (p95 par endpoint, seuils k6 automatisés).
- Taille des fichiers transférés : limite contractuelle 1 Go, validée côté
  serveur (413 au-delà) — testée unitairement.

## 6. Captures

Sorties k6 brutes : `perf/k6-download-results.txt` et `perf/k6-upload-results.txt`.
