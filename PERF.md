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

Mesures du 2026-07-17 sur le build de production (`npm run build` puis
`npm run preview`), Lighthouse en ligne de commande (`npx lighthouse`),
Chrome headless. « Mobile » = préréglage par défaut de Lighthouse (Moto G,
réseau 4G lent, CPU ralenti ×4) ; « Desktop » = `--preset=desktop`.

| Indicateur                 | Budget visé | Mesuré                              |
| -------------------------- | ----------- | ----------------------------------- |
| Taille du bundle JS (gzip) | < 250 Ko    | **83,4 Ko** (+ 2,6 Ko CSS)          |
| First Contentful Paint     | < 1,5 s     | **0,3 s** desktop / **1,4 s** mobile |
| Lighthouse — Performance   | ≥ 90        | **100** desktop / **100** mobile    |

**Budget tenu sur les trois indicateurs.** Une première mesure mobile donnait
89/100 (FCP 2,9 s) : la feuille de style Google Fonts, chargée de façon
bloquante, retardait le premier rendu d'environ 1 s. Correctif dans
`index.html` : chargement non bloquant (`media="print"` + `onload`, fallback
`<noscript>`), la page s'affiche d'abord en police système puis bascule sur
DM Sans (`display=swap`). Résultat : mobile 89 → 100, FCP 2,9 s → 1,4 s.

Reproduire les mesures :

```bash
cd Code/FE/frontend
npm run build        # affiche la taille des chunks (Vite/Rollup)
npm run preview      # sert dist/ sur http://localhost:4173
npx lighthouse http://localhost:4173 --only-categories=performance \
  --chrome-flags="--headless=new"            # mobile (défaut)
npx lighthouse http://localhost:4173 --only-categories=performance \
  --preset=desktop --chrome-flags="--headless=new"
```

## 5. Métriques suivies

- Temps de réponse back : voir §3 (p95 par endpoint, seuils k6 automatisés).
- Taille des fichiers transférés : limite contractuelle 1 Go, validée côté
  serveur (413 au-delà) — testée unitairement.

## 6. Captures

Sorties k6 brutes : `perf/k6-download-results.txt` et `perf/k6-upload-results.txt`.
