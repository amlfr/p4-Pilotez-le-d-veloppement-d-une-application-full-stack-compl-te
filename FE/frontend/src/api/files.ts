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

/** Pulls the bare token out of a backend download_url (".../files/{token}/download"). */
export function tokenFromDownloadUrl(url: string): string {
  const match = /\/files\/([^/]+)\/download/.exec(url);
  return match ? match[1] : url;
}

/** File details shown before download (US02). 404 if the token is unknown or expired. */
export async function getFileMetadata(token: string): Promise<FileMetadata> {
  const response = await fetch(`/api/files/${token}`);
  if (!response.ok) {
    throw await toApiError(response);
  }
  return response.json();
}

/** Fetches the file bytes. Sends the password when the file is protected. */
export async function fetchFileBlob(
  token: string,
  password?: string,
): Promise<Blob> {
  const query = password ? `?password=${encodeURIComponent(password)}` : "";
  const response = await fetch(`/api/files/${token}/download${query}`);
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
