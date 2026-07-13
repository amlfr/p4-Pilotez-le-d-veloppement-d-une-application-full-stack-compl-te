import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { decodeToken, register } from "../../api/auth";
import { ApiError } from "../../api/client";
import { useAuthStore } from "../../store/auth";
import Register from "../../pages/Register/Register";

vi.mock("../../api/auth", () => ({
  register: vi.fn(),
  decodeToken: vi.fn(),
}));

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/files" element={<p>page mes fichiers</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function submit() {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText("Saisissez votre nom..."), "Léa");
  await user.type(
    screen.getByPlaceholderText("Saisissez votre email..."),
    "lea@example.com",
  );
  await user.type(
    screen.getByPlaceholderText("Saisissez votre mot de passe..."),
    "motdepasse123",
  );
  await user.click(screen.getByRole("button", { name: "Créer mon compte" }));
}

/** US01 : inscription avec auto-connexion (le token revient du register). */
describe("Register", () => {
  beforeEach(() => {
    vi.mocked(register).mockReset();
    vi.mocked(decodeToken).mockReset();
    useAuthStore.setState({ token: null, name: null, email: null });
  });

  it("inscription réussie → session en store et redirection vers /files", async () => {
    vi.mocked(register).mockResolvedValue({
      id: "u-1",
      email: "lea@example.com",
      token: "jwt-neuf",
    });
    vi.mocked(decodeToken).mockReturnValue({
      sub: "lea@example.com",
      name: "Léa",
    });

    renderRegister();
    await submit();

    expect(await screen.findByText("page mes fichiers")).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBe("jwt-neuf");
    expect(register).toHaveBeenCalledWith(
      "Léa",
      "lea@example.com",
      "motdepasse123",
    );
  });

  it("409 email déjà utilisé → le message du backend est affiché", async () => {
    vi.mocked(register).mockRejectedValue(
      new ApiError(409, "Cet email est déjà utilisé"),
    );

    renderRegister();
    await submit();

    expect(
      await screen.findByText("Cet email est déjà utilisé"),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("erreur inattendue → message générique", async () => {
    vi.mocked(register).mockRejectedValue(new ApiError(500, "boom"));

    renderRegister();
    await submit();

    expect(
      await screen.findByText("Une erreur est survenue, réessayez plus tard"),
    ).toBeInTheDocument();
  });
});
