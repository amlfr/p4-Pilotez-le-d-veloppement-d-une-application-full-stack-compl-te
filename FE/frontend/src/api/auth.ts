export interface AuthResponse {
  id: string;
  email: string;
  token: string;
}

export interface TokenResponse {
  token: string;
  expires_in: number;
}

interface ErrorBody {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Decodes the JWT payload (no verification — display purposes only). */
export function decodeToken(token: string): {
  sub: string;
  name?: string;
  userId?: string;
} {
  const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(payload));
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Erreur ${response.status}`;
    try {
      const data = (await response.json()) as ErrorBody;
      if (data.message) message = data.message;
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(response.status, message);
  }

  return response.json();
}

export function login(email: string, password: string): Promise<TokenResponse> {
  return post("/api/auth/login", { email, password });
}

export function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return post("/api/auth/register", { name, email, password });
}
