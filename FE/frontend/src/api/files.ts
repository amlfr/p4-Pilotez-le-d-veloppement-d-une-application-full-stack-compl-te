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
