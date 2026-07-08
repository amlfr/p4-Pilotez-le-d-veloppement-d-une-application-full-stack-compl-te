import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "../../store/auth";
import RequireAuth from "./RequireAuth";

function renderGuardedRoute() {
  return render(
    <MemoryRouter initialEntries={["/files"]}>
      <Routes>
        <Route path="/" element={<p>Accueil public</p>} />
        <Route element={<RequireAuth />}>
          <Route path="/files" element={<p>Espace connecté</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAuth", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, name: null, email: null });
  });

  it("sans token, redirige vers la page d'accueil", () => {
    renderGuardedRoute();

    expect(screen.getByText("Accueil public")).toBeInTheDocument();
    expect(screen.queryByText("Espace connecté")).not.toBeInTheDocument();
  });

  it("avec un token, rend la route protégée", () => {
    useAuthStore.setState({ token: "jwt-abc" });

    renderGuardedRoute();

    expect(screen.getByText("Espace connecté")).toBeInTheDocument();
  });
});
