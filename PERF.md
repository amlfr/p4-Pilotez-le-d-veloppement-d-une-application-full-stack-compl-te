# Suivi de performance — DataShare

## 1. Endpoint critique testé

**Choix : `POST /api/files` (upload)** — c'est le chemin le plus coûteux
(écriture disque + métadonnées + validation). Alternative possible :
`GET /api/files/{token}/download`.

## 2. Test de performance (k6)

Script suggéré (`perf/upload.js`) :

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10, // utilisateurs virtuels
  duration: '30s',
};

export default function () {
  const file = http.file(open('./sample.bin', 'b'), 'sample.bin');
  const res = http.post('http://localhost:8080/api/files', {
    file: file,
    expires_in_days: '3',
  });
  check(res, { 'status 201': (r) => r.status === 201 });
}
```

Exécution :

```bash
k6 run perf/upload.js
```

## 3. Résultats et interprétation

| Métrique         | Valeur        |
| ---------------- | ------------- |
| Requêtes/s (RPS) | _À compléter_ |
| Latence p95      | _À compléter_ |
| Latence moyenne  | _À compléter_ |
| Taux d'erreur    | _À compléter_ |

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

- Temps de réponse (back) — voir §3.
- Taille des fichiers transférés (limite 1 Go).

## 6. Captures

> **Insérer ici** les captures de la sortie k6 et du rapport Lighthouse.
> `![k6](./docs/k6.png)` · `![Lighthouse](./docs/lighthouse.png)`
