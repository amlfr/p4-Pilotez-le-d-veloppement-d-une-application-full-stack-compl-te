import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import UploadSuccess from "../../pages/Upload/UploadSuccess";

const file = new File(["contenu"], "rapport.pdf", { type: "application/pdf" });

/** US01 (étape succès) : lien de partage affiché et copiable. */
describe("UploadSuccess", () => {
  it("affiche le lien /d/{token} et la durée de conservation", () => {
    render(<UploadSuccess file={file} token="tok-42" days={7} />);

    expect(screen.getByText("rapport.pdf")).toBeInTheDocument();
    expect(screen.getByText(/une semaine/)).toBeInTheDocument();
    expect(
      screen.getByText(`${window.location.origin}/d/tok-42`),
    ).toBeInTheDocument();
  });

  it("rétention 1 jour → libellé « 1 jour »", () => {
    render(<UploadSuccess file={file} token="tok-42" days={1} />);

    expect(screen.getByText(/pendant 1 jour/)).toBeInTheDocument();
  });

  it("Copier le lien → presse-papiers + confirmation « Lien copié ! »", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<UploadSuccess file={file} token="tok-42" days={3} />);
    await user.click(screen.getByRole("button", { name: "Copier le lien" }));

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/d/tok-42`,
    );
    expect(await screen.findByText("Lien copié !")).toBeInTheDocument();
  });
});
