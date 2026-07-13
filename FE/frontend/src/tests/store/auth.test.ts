import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "../../store/auth";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    localStorage.clear();
  });

  it("setSession stocke le token et l'utilisateur, isLoggedIn devient vrai", () => {
    useAuthStore.getState().setSession("jwt-abc", "Léa", "lea@example.com");

    const state = useAuthStore.getState();
    expect(state.token).toBe("jwt-abc");
    expect(state.name).toBe("Léa");
    expect(state.email).toBe("lea@example.com");
    expect(state.isLoggedIn()).toBe(true);
  });

  it("persiste la session dans localStorage sous la clé datashare-auth", () => {
    useAuthStore.getState().setSession("jwt-abc", "Léa", "lea@example.com");

    const raw = localStorage.getItem("datashare-auth");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).state.token).toBe("jwt-abc");
  });

  it("logout vide l'état, isLoggedIn devient faux", () => {
    useAuthStore.getState().setSession("jwt-abc", "Léa", "lea@example.com");

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.name).toBeNull();
    expect(state.email).toBeNull();
    expect(state.isLoggedIn()).toBe(false);
  });
});
