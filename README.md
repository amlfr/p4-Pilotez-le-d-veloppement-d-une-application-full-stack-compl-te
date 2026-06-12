# Datashare

A file-sharing web application (upload a file, share it via a token, download it — with
per-file passwords and expiration). The project is split into a **Spring Boot** backend
and a **React** frontend.

```
Code/
├── backend/datashare-backend/   Spring Boot 4 + Java 21 REST API
└── FE/frontend/                 React 19 + TypeScript + Vite
```

---

## Backend

### Tech stack

- Java 21, Spring Boot 4.0.6
- Spring Web (MVC), Spring Security, Spring Data JPA
- PostgreSQL
- JWT auth via [JJWT](https://github.com/jwtk/jjwt)
- Lombok

### Prerequisites

- JDK 21
- A running PostgreSQL instance
- (Maven is provided through the bundled `mvnw` wrapper — no global install needed)

### Database setup

The app expects a database named `datashare`. With the default credentials in
`application.properties` (`postgres` / `0000`):

```sql
CREATE DATABASE datashare;
```

`spring.jpa.hibernate.ddl-auto=update` creates/updates the schema automatically on
startup, so the `users` table is generated for you.

### Configuration

Key settings live in `src/main/resources/application.properties`:

| Property              | Default                              | Notes                                            |
| --------------------- | ------------------------------------ | ------------------------------------------------ |
| `server.port`         | `8080`                               | API base URL is `http://localhost:8080`          |
| `spring.datasource.*` | `localhost:5432/datashare`           | Update to match your PostgreSQL setup            |
| `jwt.secret`          | env `JWT_SECRET` or a dev fallback   | **Must be ≥ 32 characters.** Override in prod.   |
| `jwt.expiration-ms`   | `86400000` (24h)                     | Token lifetime in milliseconds                   |

### Run

From `backend/datashare-backend/`:

```bash
# Windows
mvnw.cmd spring-boot:run

# macOS / Linux
./mvnw spring-boot:run
```

The API starts on `http://localhost:8080`.

---

## Authentication API

Base path: `/api/auth` (these endpoints are public; everything else requires auth).

### `POST /api/auth/register`

Creates an account. The password is stored as a BCrypt hash.

**Request body**

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "supersecret"
}
```

Validation: `name` not blank, `email` valid, `password` ≥ 8 characters.

**`201 Created`**

```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com"
}
```

**`409 Conflict`** — email already registered.
**`400 Bad Request`** — validation errors, e.g. `{ "password": "Password must be at least 8 characters" }`.

### `POST /api/auth/login`

Validates credentials and returns a signed JWT.

**Request body**

```json
{
  "email": "alice@example.com",
  "password": "supersecret"
}
```

**`200 OK`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "name": "Alice",
  "email": "alice@example.com"
}
```

**`401 Unauthorized`** — invalid email or password.

The returned token is a JWT whose subject is the user's email, with `userId` and `name`
claims, expiring after `jwt.expiration-ms`. Send it on protected requests (coming soon)
as `Authorization: Bearer <token>`.

---

## Testing with Postman

1. Start PostgreSQL and the backend (`mvnw.cmd spring-boot:run`).
2. **Register** — `POST http://localhost:8080/api/auth/register`
   - Body tab → *raw* → *JSON*, paste the register body above. Expect `201`.
3. **Login** — `POST http://localhost:8080/api/auth/login`
   - Same email/password. Expect `200` and a `token` in the response.
4. Copy the `token` — it's your Bearer credential for the protected File API once that's built.

> Tip: in Postman, set the request's *Body* to **raw / JSON**, not form-data, so
> `@RequestBody` deserializes correctly.

---

## Frontend

React 19 + TypeScript + Vite, in `FE/frontend/`.

```bash
cd FE/frontend
npm install
npm run dev
```

(Still the starter scaffold — feature pages are in progress.)
