import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "../../api/client";
import {
  buildShareLink,
  deleteFile,
  fetchFileBlob,
  getFileMetadata,
  listMyFiles,
  uploadFile,
} from "../../api/files";

vi.mock("../../api/client", () => ({
  apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

afterEach(() => {
  apiFetchMock.mockReset();
});

/** US01-US08 : wrappers d'appels API côté fichiers. */
describe("api/files", () => {
  it("buildShareLink construit le lien front /d/{token}", () => {
    expect(buildShareLink("tok-123")).toBe(
      `${window.location.origin}/d/tok-123`,
    );
  });

  it("getFileMetadata interroge l'endpoint public de métadonnées", async () => {
    apiFetchMock.mockResolvedValue({ original_name: "a.txt" });

    await getFileMetadata("tok-123");

    expect(apiFetchMock).toHaveBeenCalledWith("/api/files/tok-123");
  });

  it("fetchFileBlob envoie le mot de passe encodé dans X-File-Password, jamais dans l'URL", async () => {
    apiFetchMock.mockResolvedValue(new Blob());

    await fetchFileBlob("tok-123", "été 2026");

    expect(apiFetchMock).toHaveBeenCalledWith("/api/files/tok-123/download", {
      headers: { "X-File-Password": encodeURIComponent("été 2026") },
      parse: "blob",
    });
  });

  it("fetchFileBlob sans mot de passe n'envoie pas d'en-tête", async () => {
    apiFetchMock.mockResolvedValue(new Blob());

    await fetchFileBlob("tok-123");

    expect(apiFetchMock).toHaveBeenCalledWith("/api/files/tok-123/download", {
      headers: undefined,
      parse: "blob",
    });
  });

  it("listMyFiles passe le JWT, deleteFile utilise DELETE sans lire de corps", async () => {
    apiFetchMock.mockResolvedValue({ data: [] });
    await listMyFiles("jwt-abc");
    expect(apiFetchMock).toHaveBeenCalledWith("/api/me/files", {
      token: "jwt-abc",
    });

    apiFetchMock.mockResolvedValue(undefined);
    await deleteFile("id-1", "jwt-abc");
    expect(apiFetchMock).toHaveBeenCalledWith("/api/files/id-1", {
      method: "DELETE",
      token: "jwt-abc",
      parse: "none",
    });
  });

  it("uploadFile construit le multipart : fichier, rétention, mot de passe et tags répétés", async () => {
    apiFetchMock.mockResolvedValue({ token: "tok" });
    const file = new File(["contenu"], "notes.txt", { type: "text/plain" });

    await uploadFile(
      file,
      { expiresInDays: 3, password: "sesame99", tags: ["cours", "p4"] },
      "jwt-abc",
    );

    const [path, options] = apiFetchMock.mock.calls[0];
    expect(path).toBe("/api/files");
    expect(options?.method).toBe("POST");
    expect(options?.token).toBe("jwt-abc");
    const form = options?.form as FormData;
    expect(form.get("file")).toBe(file);
    expect(form.get("expires_in_days")).toBe("3");
    expect(form.get("password")).toBe("sesame99");
    expect(form.getAll("tags")).toEqual(["cours", "p4"]);
  });

  it("uploadFile anonyme : ni mot de passe ni tags dans le formulaire", async () => {
    apiFetchMock.mockResolvedValue({ token: "tok" });
    const file = new File(["x"], "x.txt", { type: "text/plain" });

    await uploadFile(file, { expiresInDays: 7 });

    const [, options] = apiFetchMock.mock.calls[0];
    const form = options?.form as FormData;
    expect(form.get("password")).toBeNull();
    expect(form.getAll("tags")).toEqual([]);
    expect(options?.token).toBeUndefined();
  });
});
