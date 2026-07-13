import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteFile, listMyFiles, type FileListItem } from "../../api/files";
import { useAuthStore } from "../../store/auth";
import MyFiles from "../../pages/MyFiles/MyFiles";

vi.mock("../../api/files", () => ({
  listMyFiles: vi.fn(),
  deleteFile: vi.fn(),
  buildShareLink: (token: string) => `http://localhost/d/${token}`,
}));

const DAY_MS = 86_400_000;

function item(overrides: Partial<FileListItem>): FileListItem {
  return {
    id: "f-1",
    original_name: "notes.txt",
    size_bytes: 1024,
    uploaded_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 2.5 * DAY_MS).toISOString(),
    is_expired: false,
    download_url: "http://localhost:8080/api/files/tok/download",
    token: "tok",
    tags: [],
    password_protected: false,
    ...overrides,
  };
}

function renderMyFiles() {
  return render(
    <MemoryRouter initialEntries={["/files"]}>
      <MyFiles />
    </MemoryRouter>,
  );
}

/** US05/US06 : historique « Mes fichiers » et suppression. */
describe("MyFiles", () => {
  beforeEach(() => {
    vi.mocked(listMyFiles).mockReset();
    vi.mocked(deleteFile).mockReset();
    useAuthStore.setState({
      token: "jwt-abc",
      name: "Léa",
      email: "lea@example.com",
    });
  });

  it("affiche les fichiers : expiration, cadenas, tags, note pour les expirés", async () => {
    vi.mocked(listMyFiles).mockResolvedValue({
      data: [
        item({
          id: "f-actif",
          original_name: "rapport.pdf",
          password_protected: true,
          tags: ["cours", "p4"],
        }),
        item({
          id: "f-expire",
          original_name: "ancien.zip",
          is_expired: true,
          expires_at: new Date(Date.now() - DAY_MS).toISOString(),
        }),
      ],
      total: 2,
      page: 1,
      per_page: 20,
    });

    renderMyFiles();

    const activeRow = (await screen.findByText("rapport.pdf")).closest("li")!;
    expect(within(activeRow).getByText("Expire dans 3 jours")).toBeInTheDocument();
    expect(
      within(activeRow).getByTitle("Protégé par mot de passe"),
    ).toBeInTheDocument();
    expect(within(activeRow).getByText("cours")).toBeInTheDocument();

    const expiredRow = screen.getByText("ancien.zip").closest("li")!;
    expect(within(expiredRow).getByText("Expiré")).toBeInTheDocument();
    expect(
      within(expiredRow).getByText(/Ce fichier a expiré/),
    ).toBeInTheDocument();
    expect(within(expiredRow).queryByText("Supprimer")).not.toBeInTheDocument();

    // Le shell « Mon espace » affiche l'utilisateur connecté.
    expect(screen.getByText("Léa")).toBeInTheDocument();
  });

  it("les filtres Actifs / Expirés restreignent la liste", async () => {
    vi.mocked(listMyFiles).mockResolvedValue({
      data: [
        item({ id: "f-1", original_name: "actif.txt" }),
        item({ id: "f-2", original_name: "vieux.txt", is_expired: true }),
      ],
      total: 2,
      page: 1,
      per_page: 20,
    });
    const user = userEvent.setup();

    renderMyFiles();
    await screen.findByText("actif.txt");

    await user.click(screen.getByRole("tab", { name: "Actifs" }));
    expect(screen.queryByText("vieux.txt")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Expirés" }));
    expect(screen.getByText("vieux.txt")).toBeInTheDocument();
    expect(screen.queryByText("actif.txt")).not.toBeInTheDocument();
  });

  it("supprimer son unique fichier vide la liste", async () => {
    vi.mocked(listMyFiles).mockResolvedValue({
      data: [item({ id: "f-seul", original_name: "a-supprimer.txt" })],
      total: 1,
      page: 1,
      per_page: 20,
    });
    vi.mocked(deleteFile).mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderMyFiles();
    await screen.findByText("a-supprimer.txt");

    await user.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(deleteFile).toHaveBeenCalledWith("f-seul", "jwt-abc");
    expect(screen.queryByText("a-supprimer.txt")).not.toBeInTheDocument();
    expect(
      screen.getByText("Aucun fichier pour le moment"),
    ).toBeInTheDocument();
  });

  it("copie le lien de partage front dans le presse-papiers", async () => {
    vi.mocked(listMyFiles).mockResolvedValue({
      data: [item({ id: "f-1", original_name: "notes.txt", token: "tok-42" })],
      total: 1,
      page: 1,
      per_page: 20,
    });
    // Après setup() : userEvent installe son propre stub de presse-papiers.
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    renderMyFiles();
    await screen.findByText("notes.txt");

    await user.click(screen.getByRole("button", { name: "Copier le lien" }));

    expect(writeText).toHaveBeenCalledWith("http://localhost/d/tok-42");
    expect(await screen.findByText("Copié !")).toBeInTheDocument();
  });

  it("échec du chargement → message d'erreur", async () => {
    vi.mocked(listMyFiles).mockRejectedValue(new Error("réseau"));

    renderMyFiles();

    expect(
      await screen.findByText(
        "Impossible de charger vos fichiers, réessayez plus tard",
      ),
    ).toBeInTheDocument();
  });
});
