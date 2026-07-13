import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { decodeToken, login } from "../../api/auth";
import { ApiError } from "../../api/client";
import { useAuthStore } from "../../store/auth";
import Login from "../../pages/Login/Login";

vi.mock("../../api/auth", () => ({
  login: vi.fn(),
  decodeToken: vi.fn(),
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/files" element={<p>page mes fichiers</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function submit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(
    screen.getByPlaceholderText("Saisissez votre email..."),
    email,
  );
  await user.type(
    screen.getByPlaceholderText("Saisissez votre mot de passe..."),
    password,
  );
  await user.click(screen.getByRole("button", { name: "Connexion" }));
}

/** US01 : connexion par email. */
describe("Login", () => {
  beforeEach(() => {
    vi.mocked(login).mockReset();
    vi.mocked(decodeToken).mockReset();
    useAuthStore.setState({ token: null, name: null, email: null });
  });

  it("connexion réussie → session en store et redirection vers /files", async () => {
    vi.mocked(login).mockResolvedValue({ token: "jwt-1", expires_in: 3600 });
    vi.mocked(decodeToken).mockReturnValue({
      sub: "lea@example.com",
      name: "Léa",
    });

    renderLogin();
    await submit("lea@example.com", "motdepasse123");

    expect(await screen.findByText("page mes fichiers")).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBe("jwt-1");
    expect(useAuthStore.getState().name).toBe("Léa");
    expect(login).toHaveBeenCalledWith("lea@example.com", "motdepasse123");
  });

  it("401 → « Email ou mot de passe incorrect », pas de session", async () => {
    vi.mocked(login).mockRejectedValue(new ApiError(401, "Identifiants invalides"));

    renderLogin();
    await submit("lea@example.com", "mauvais");

    expect(
      await screen.findByText("Email ou mot de passe incorrect"),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("erreur réseau → message générique", async () => {
    vi.mocked(login).mockRejectedValue(new Error("réseau"));

    renderLogin();
    await submit("lea@example.com", "motdepasse123");

    expect(
      await screen.findByText("Une erreur est survenue, réessayez plus tard"),
    ).toBeInTheDocument();
  });
});
