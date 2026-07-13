import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Upload from "../../pages/Upload/Upload";

/** Picks a file through the page's hidden <input type="file">. */
async function pickFile(file: File) {
  const { container } = render(<Upload />);
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  await userEvent.upload(input!, file);
}

describe("Upload — validation client du fichier", () => {
  it("refuse un fichier de plus de 1 Go avec le message français", async () => {
    const big = new File(["x"], "enorme.bin");
    // Un vrai payload de 1 Go serait absurde : on truque la taille rapportée.
    Object.defineProperty(big, "size", { value: 1024 ** 3 + 1 });

    await pickFile(big);

    expect(
      await screen.findByText("La taille des fichiers est limitée à 1 Go"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Téléverser" })).toBeDisabled();
  });

  it("refuse une extension interdite (.exe), insensible à la casse", async () => {
    await pickFile(new File(["x"], "VIRUS.EXE"));

    expect(
      await screen.findByText("Ce type de fichier n'est pas autorisé"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Téléverser" })).toBeDisabled();
  });

  it("accepte un fichier valide : formulaire actif, nom affiché", async () => {
    await pickFile(new File(["contenu"], "rapport.pdf"));

    expect(await screen.findByText("rapport.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Téléverser" })).toBeEnabled();
  });
});
