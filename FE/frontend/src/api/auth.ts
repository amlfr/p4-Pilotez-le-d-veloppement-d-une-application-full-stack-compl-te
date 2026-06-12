export interface AuthResponse {
  token: string
  tokenType: string
  name: string
  email: string
}

export interface UserResponse {
  id: number
  name: string
  email: string
}

export class ApiError extends Error {
  status: number
  /** Field-level validation errors ({field: message}) when the backend returns 400. */
  fields?: Record<string, string>

  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let message = `Erreur ${response.status}`
    let fields: Record<string, string> | undefined
    try {
      const data = await response.json()
      if (data.message) {
        message = data.message
      } else if (typeof data === 'object') {
        fields = data
      }
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(response.status, message, fields)
  }

  return response.json()
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return post('/api/auth/login', { email, password })
}

export function register(name: string, email: string, password: string): Promise<UserResponse> {
  return post('/api/auth/register', { name, email, password })
}
