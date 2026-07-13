import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import TagInput from "../../components/TagInput/TagInput";

describe("TagInput", () => {
  it("ajoute un tag avec Entrée", async () => {
    const onTagsChange = vi.fn();
    render(<TagInput tags={[]} onTagsChange={onTagsChange} />);

    await userEvent.type(screen.getByLabelText("Tags (optionnel)"), "cours{Enter}");

    expect(onTagsChange).toHaveBeenCalledWith(["cours"]);
  });

  it("ajoute un tag avec la virgule", async () => {
    const onTagsChange = vi.fn();
    render(<TagInput tags={["cours"]} onTagsChange={onTagsChange} />);

    await userEvent.type(screen.getByLabelText("Tags (optionnel)"), "projet,");

    expect(onTagsChange).toHaveBeenCalledWith(["cours", "projet"]);
  });

  it("refuse un doublon insensible à la casse avec un message", async () => {
    const onTagsChange = vi.fn();
    render(<TagInput tags={["cours"]} onTagsChange={onTagsChange} />);

    await userEvent.type(screen.getByLabelText("Tags (optionnel)"), "COURS{Enter}");

    expect(screen.getByText("Ce tag est déjà ajouté")).toBeInTheDocument();
    expect(onTagsChange).not.toHaveBeenCalled();
  });

  it("refuse un tag de plus de 30 caractères avec un message", () => {
    const onTagsChange = vi.fn();
    render(<TagInput tags={[]} onTagsChange={onTagsChange} />);
    const input = screen.getByLabelText("Tags (optionnel)");

    // fireEvent contourne le maxLength de l'input (cas d'un collage).
    fireEvent.change(input, { target: { value: "a".repeat(31) } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(
      screen.getByText("Un tag ne peut pas dépasser 30 caractères"),
    ).toBeInTheDocument();
    expect(onTagsChange).not.toHaveBeenCalled();
  });

  it("Backspace sur un champ vide retire le dernier tag", async () => {
    const onTagsChange = vi.fn();
    render(<TagInput tags={["cours", "projet"]} onTagsChange={onTagsChange} />);

    await userEvent.type(screen.getByLabelText("Tags (optionnel)"), "{Backspace}");

    expect(onTagsChange).toHaveBeenCalledWith(["cours"]);
  });

  it("le bouton × retire le tag visé", async () => {
    const onTagsChange = vi.fn();
    render(<TagInput tags={["cours", "projet"]} onTagsChange={onTagsChange} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Retirer le tag cours" }),
    );

    expect(onTagsChange).toHaveBeenCalledWith(["projet"]);
  });
});
