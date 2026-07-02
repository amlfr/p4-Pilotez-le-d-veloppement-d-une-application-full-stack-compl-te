import { apiFetch } from "./client";

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
export function getFileMetadata(token: string): Promise<FileMetadata> {
  return apiFetch<FileMetadata>(`/api/files/${token}`);
}

/**
 * Fetches the file bytes. The password goes in the X-File-Password header — never
 * the URL, which gets logged — URL-encoded so accents survive (the backend decodes).
 */
export function fetchFileBlob(token: string, password?: string): Promise<Blob> {
  return apiFetch<Blob>(`/api/files/${token}/download`, {
    headers: password
      ? { "X-File-Password": encodeURIComponent(password) }
      : undefined,
    parse: "blob",
  });
}

export function listMyFiles(authToken: string): Promise<FileListResponse> {
  return apiFetch<FileListResponse>("/api/me/files", { token: authToken });
}

export function deleteFile(id: string, authToken: string): Promise<void> {
  return apiFetch<void>(`/api/files/${id}`, {
    method: "DELETE",
    token: authToken,
    parse: "none",
  });
}

export interface UploadOptions {
  expiresInDays: number;
  password?: string;
  tags?: string[];
}

export function uploadFile(
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

  return apiFetch<UploadResponse>("/api/files", {
    method: "POST",
    form,
    token: authToken,
  });
}
