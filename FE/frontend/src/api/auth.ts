import { apiFetch } from "./client";

export interface AuthResponse {
  id: string;
  email: string;
  token: string;
}

export interface TokenResponse {
  token: string;
  expires_in: number;
}

/** Decodes the JWT payload (no verification — display purposes only). */
export function decodeToken(token: string): {
  sub: string;
  name?: string;
  userId?: string;
} {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  // atob alone garbles UTF-8 (it decodes to Latin-1), so accented names
  // like "Léa" need a real UTF-8 decode of the raw bytes.
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function login(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/auth/login", {
    method: "POST",
    json: { email, password },
  });
}

export function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    json: { name, email, password },
  });
}
