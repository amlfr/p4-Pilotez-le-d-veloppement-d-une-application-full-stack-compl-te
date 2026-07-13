import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiFetch } from "../../api/client";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
  fetchMock.mockReset();
});

describe("apiFetch", () => {
  it("pose l'en-tête Authorization quand un token est fourni et parse le JSON", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { data: [] }));

    const result = await apiFetch<{ data: unknown[] }>("/api/me/files", {
      token: "jwt-abc",
    });

    expect(result).toEqual({ data: [] });
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/me/files");
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer jwt-abc");
  });

  it("sérialise le body json et pose Content-Type application/json", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { token: "t" }));

    await apiFetch("/api/auth/login", {
      method: "POST",
      json: { email: "lea@example.com" },
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe('{"email":"lea@example.com"}');
  });

  it("transmet les en-têtes supplémentaires (X-File-Password)", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}));

    await apiFetch("/api/files/tok/download", {
      headers: { "X-File-Password": "secret6" },
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["X-File-Password"]).toBe("secret6");
  });

  it("mappe une réponse d'erreur en ApiError avec le message français du backend", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        status: 409,
        error: "Conflict",
        message: "Cet email est déjà utilisé",
        timestamp: "2026-07-05T00:00:00Z",
      }),
    );

    const error = await apiFetch("/api/auth/register", {
      method: "POST",
      json: {},
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(409);
    expect((error as ApiError).message).toBe("Cet email est déjà utilisé");
  });

  it("retombe sur un message générique quand le corps d'erreur n'est pas du JSON", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    const error = await apiFetch("/api/files").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe("Erreur 500");
  });

  it("parse:'none' ne lit pas de corps (204) et parse:'blob' retourne un Blob", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const nothing = await apiFetch<undefined>("/api/files/id", {
      method: "DELETE",
      parse: "none",
    });
    expect(nothing).toBeUndefined();

    // Response vient de Node (undici) : on lui passe une string, pas un Blob jsdom.
    fetchMock.mockResolvedValueOnce(new Response("octets", { status: 200 }));
    const blob = await apiFetch<Blob>("/api/files/tok/download", {
      parse: "blob",
    });
    expect(await blob.text()).toBe("octets");
  });
});
