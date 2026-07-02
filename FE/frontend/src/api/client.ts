/** Error body shared by all endpoints (OpenAPI: ErrorResponse). */
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

/** Builds an ApiError from a failed response, keeping the backend's French message. */
async function toApiError(response: Response): Promise<ApiError> {
  let message = `Erreur ${response.status}`;
  try {
    const data = (await response.json()) as ErrorBody;
    if (data.message) message = data.message;
  } catch {
    // Non-JSON error body; keep the generic message.
  }
  return new ApiError(response.status, message);
}

interface ApiFetchOptions {
  method?: string;
  /** Adds an Authorization: Bearer header when set. */
  token?: string | null;
  /** JSON body — also sets the Content-Type header. */
  json?: unknown;
  /** Multipart body — no Content-Type, the browser sets the boundary itself. */
  form?: FormData;
  /** Extra headers, e.g. X-File-Password. */
  headers?: Record<string, string>;
  /** How to read the response: "none" for 204s, "blob" for file bytes. */
  parse?: "json" | "blob" | "none";
}

/**
 * The one fetch used by the whole API layer: builds the headers, throws an
 * ApiError on any non-OK response, and parses the body.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { method = "GET", token, json, form, parse = "json" } = options;

  const headers: Record<string, string> = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(path, {
    method,
    headers,
    body: json !== undefined ? JSON.stringify(json) : form,
  });

  if (!response.ok) {
    throw await toApiError(response);
  }
  if (parse === "none") return undefined as T;
  if (parse === "blob") return (await response.blob()) as T;
  return response.json();
}
