import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../../api/client";
import { uploadFile } from "../../api/files";
import { useAuthStore } from "../../store/auth";
import UploadForm from "../../pages/Upload/UploadForm";

vi.mock("../../api/files", () => ({
  uploadFile: vi.fn(),
}));

const file = new File(["contenu"], "notes.txt", { type: "text/plain" });

function renderForm(onSuccess = vi.fn(), onRemove = vi.fn()) {
  render(
    <UploadForm
      file={file}
      fileError=""
      onRemove={onRemove}
      onSuccess={onSuccess}
    />,
  );
  return { onSuccess, onRemove };
}

/** US01/US07/US09 : le formulaire d'envoi (options + validation locale). */
describe("UploadForm", () => {
  beforeEach(() => {
    vi.mocked(uploadFile).mockReset();
    useAuthStore.setState({ token: null, name: null, email: null });
  });

  it("anonyme : pas d'éditeur de tags, upload sans tags ni token", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadFile).mockResolvedValue({
      id: "f-1",
      download_url: "http://localhost:8080/api/files/tok/download",
      token: "tok",
      expires_at: "2026-07-17T00:00:00Z",
    });
    const { onSuccess } = renderForm();

    expect(screen.queryByLabelText("Tags (optionnel)")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox"), "3");
    await user.click(screen.getByRole("button", { name: "Téléverser" }));

    expect(uploadFile).toHaveBeenCalledWith(
      file,
      { expiresInDays: 3, password: undefined, tags: undefined },
      null,
    );
    expect(onSuccess).toHaveBeenCalledWith(expect.anything(), 3);
  });

  it("mot de passe trop court → erreur locale, aucun appel réseau", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(
      screen.getByPlaceholderText("Protégez votre fichier..."),
      "abc",
    );
    await user.click(screen.getByRole("button", { name: "Téléverser" }));

    expect(
      screen.getByText("Le mot de passe doit contenir au moins 6 caractères"),
    ).toBeInTheDocument();
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("connecté : les tags saisis partent avec l'upload", async () => {
    useAuthStore.setState({
      token: "jwt-abc",
      name: "Léa",
      email: "lea@example.com",
    });
    const user = userEvent.setup();
    vi.mocked(uploadFile).mockResolvedValue({
      id: "f-1",
      download_url: "http://localhost:8080/api/files/tok/download",
      token: "tok",
      expires_at: "2026-07-17T00:00:00Z",
    });
    renderForm();

    await user.type(screen.getByLabelText("Tags (optionnel)"), "cours{enter}");
    await user.click(screen.getByRole("button", { name: "Téléverser" }));

    expect(uploadFile).toHaveBeenCalledWith(
      file,
      { expiresInDays: 7, password: undefined, tags: ["cours"] },
      "jwt-abc",
    );
  });

  it("session expirée (401) → message dédié", async () => {
    useAuthStore.setState({
      token: "jwt-perime",
      name: "Léa",
      email: "lea@example.com",
    });
    const user = userEvent.setup();
    vi.mocked(uploadFile).mockRejectedValue(new ApiError(401, "expiré"));
    renderForm();

    await user.click(screen.getByRole("button", { name: "Téléverser" }));

    expect(
      await screen.findByText("Session expirée, veuillez vous reconnecter"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Téléverser" }),
    ).toBeInTheDocument();
  });

  it("erreur backend (413…) → le message français du backend est affiché", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadFile).mockRejectedValue(
      new ApiError(413, "La taille des fichiers est limitée à 1 Go"),
    );
    renderForm();

    await user.click(screen.getByRole("button", { name: "Téléverser" }));

    expect(
      await screen.findByText("La taille des fichiers est limitée à 1 Go"),
    ).toBeInTheDocument();
  });

  it("Retirer déclenche onRemove", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderForm();

    await user.click(screen.getByRole("button", { name: "Retirer" }));

    expect(onRemove).toHaveBeenCalled();
  });
});
