import { toApiError } from "./auth";

export interface UploadResponse {
  id: string;
  download_url: string;
  token: string;
  expires_at: string;
}

export interface FileListItem {
  id: string;
  original_name: string;
  size_bytes: number;
  uploaded_at: string;
  expires_at: string;
  is_expired: boolean;
  download_url: string;
  token: string;
  tags: string[];
  password_protected: boolean;
}

export interface FileListResponse {
  data: FileListItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface FileMetadata {
  original_name: string;
  size_bytes: number;
  mime_type: string;
  expires_at: string;
  password_protected: boolean;
}

/** The public link a recipient opens — our download page, not the raw API endpoint. */
export function buildShareLink(token: string): string {
  return `${window.location.origin}/d/${token}`;
}

/** File details shown before download (US02). 404 if the token is unknown or expired. */
export async function getFileMetadata(token: string): Promise<FileMetadata> {
  const response = await fetch(`/api/files/${token}`);
  if (!response.ok) {
    throw await toApiError(response);
  }
  return response.json();
}

/**
 * Fetches the file bytes. The password travels in the X-File-Password header —
 * never in the URL, which ends up in server logs and browser history. It is
 * URL-encoded so accented characters survive HTTP's Latin-1 header restriction
 * (the backend decodes it).
 */
export async function fetchFileBlob(
  token: string,
  password?: string,
): Promise<Blob> {
  const headers: Record<string, string> = {};
  if (password) {
    headers["X-File-Password"] = encodeURIComponent(password);
  }
  const response = await fetch(`/api/files/${token}/download`, { headers });
  if (!response.ok) {
    throw await toApiError(response);
  }
  return response.blob();
}

export async function listMyFiles(authToken: string): Promise<FileListResponse> {
  const response = await fetch("/api/me/files", {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!response.ok) {
    throw await toApiError(response);
  }
  return response.json();
}

export async function deleteFile(id: string, authToken: string): Promise<void> {
  const response = await fetch(`/api/files/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!response.ok) {
    throw await toApiError(response);
  }
}

export interface UploadOptions {
  expiresInDays: number;
  password?: string;
  tags?: string[];
}

export async function uploadFile(
  file: File,
  options: UploadOptions,
  authToken?: string | null,
): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("expires_in_days", String(options.expiresInDays));
  if (options.password) {
    form.append("password", options.password);
  }
  // One repeated "tags" field per tag — the backend reads them as a List (US08).
  options.tags?.forEach((tag) => form.append("tags", tag));

  // No Content-Type header: the browser sets the multipart boundary itself.
  // No Authorization when anonymous (US07) — the upload is then owner-less.
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const response = await fetch("/api/files", {
    method: "POST",
    headers,
    body: form,
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  return response.json();
}
