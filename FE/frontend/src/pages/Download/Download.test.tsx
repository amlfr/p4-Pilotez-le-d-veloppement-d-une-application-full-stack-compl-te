import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../../api/client";
import { getFileMetadata, type FileMetadata } from "../../api/files";
import Download from "./Download";

vi.mock("../../api/files", () => ({
  getFileMetadata: vi.fn(),
  fetchFileBlob: vi.fn(),
}));

const metadata: FileMetadata = {
  original_name: "rapport.pdf",
  size_bytes: 204800,
  mime_type: "application/pdf",
  expires_at: "2026-07-10T12:00:00Z",
  password_protected: false,
};

function renderAt(token: string) {
  return render(
    <MemoryRouter initialEntries={[`/d/${token}`]}>
      <Routes>
        <Route path="/d/:token" element={<Download />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Download — page destinataire", () => {
  beforeEach(() => {
    vi.mocked(getFileMetadata).mockReset();
  });

  it("lien invalide (404) → message d'indisponibilité", async () => {
    vi.mocked(getFileMetadata).mockRejectedValue(new ApiError(404, "Lien invalide"));

    renderAt("token-inconnu");

    expect(
      await screen.findByText(
        "Ce lien est invalide ou le fichier n'est plus disponible",
      ),
    ).toBeInTheDocument();
  });

  it("fichier libre → métadonnées affichées, pas de champ mot de passe", async () => {
    vi.mocked(getFileMetadata).mockResolvedValue(metadata);

    renderAt("token-ok");

    expect(await screen.findByText("rapport.pdf")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Saisissez le mot de passe"),
    ).not.toBeInTheDocument();
  });

  it("fichier protégé → le champ mot de passe est affiché", async () => {
    vi.mocked(getFileMetadata).mockResolvedValue({
      ...metadata,
      password_protected: true,
    });

    renderAt("token-protege");

    expect(
      await screen.findByPlaceholderText("Saisissez le mot de passe"),
    ).toBeInTheDocument();
  });
});
