# Datashare

Share a file in a few clicks: upload it, get a link, send the link. Files can be
password-protected, tagged, and expire automatically after 1 to 7 days. You don't even
need an account to upload — registering just gets you a history page to manage your files.

```
Code/
├── backend/datashare-backend/   Spring Boot 4 + Java 21 REST API (PostgreSQL)
└── FE/frontend/                 React 19 + TypeScript + Vite
```

The full API contract lives in [`OpenAPI.yaml`](../OpenAPI.yaml). A ready-to-run Postman
collection covering every endpoint (happy paths and error cases) is in
[`backend/datashare-backend/datashare.postman_collection.json`](backend/datashare-backend/datashare.postman_collection.json).

## Running it

You need JDK 21, Node, and a local PostgreSQL with a `datashare` database:

```sql
CREATE DATABASE datashare;
```

The schema is created automatically on first startup. Database credentials and other
settings (port, JWT secret, storage directory…) are in
`backend/datashare-backend/src/main/resources/application.properties` — the defaults
work for local development.

Backend, from `backend/datashare-backend/`:

```bash
mvnw.cmd spring-boot:run      # Windows
./mvnw spring-boot:run        # macOS / Linux
```

Frontend, from `FE/frontend/`:

```bash
npm install
npm run dev
```

Then open http://localhost:5173 — the Vite dev server proxies `/api` calls to the
backend on port 8080.

## What's inside

- **Upload** (logged in or anonymous): 1 Go max, executables refused, optional download
  password, retention of 1–7 days, optional tags for logged-in users.
- **Share links** open a public download page; protected files ask for the password
  (sent in a header, never in the URL).
- **Mon espace**: your upload history with expiry status, copy-link, tag display, and delete.
- **Housekeeping**: a daily job purges expired files (bytes and metadata).

Auth is JWT-based (login by email, BCrypt-hashed passwords). Uploaded bytes live on disk
under a random name; only metadata goes to PostgreSQL.
