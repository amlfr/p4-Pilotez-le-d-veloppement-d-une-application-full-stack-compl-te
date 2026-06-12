import { toApiError } from "./auth";

export interface UploadResponse {
  id: string;
  download_url: string;
  token: string;
  expires_at: string;
}

export interface UploadOptions {
  expiresInDays: number;
  password?: string;
}

export async function uploadFile(
  file: File,
  options: UploadOptions,
  authToken: string,
): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("expires_in_days", String(options.expiresInDays));
  if (options.password) {
    form.append("password", options.password);
  }

  // No Content-Type header: the browser sets the multipart boundary itself.
  const response = await fetch("/api/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
    body: form,
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  return response.json();
}
