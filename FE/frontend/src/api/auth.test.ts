import { describe, expect, it } from "vitest";

import { decodeToken } from "./auth";

/** Builds an unsigned JWT-shaped token whose payload is base64url-encoded UTF-8. */
function tokenWithPayload(payload: object): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const base64url = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `entete.${base64url}.signature`;
}

describe("decodeToken", () => {
  it("décode les accents UTF-8 du payload (« Léa », pas « LÃ©a »)", () => {
    const token = tokenWithPayload({
      sub: "lea@example.com",
      name: "Léa",
      userId: "42",
    });

    const claims = decodeToken(token);

    expect(claims.name).toBe("Léa");
    expect(claims.sub).toBe("lea@example.com");
    expect(claims.userId).toBe("42");
  });

  it("gère l'alphabet base64url (- et _) utilisé par les JWT", () => {
    // "ﬃ~" produces bytes whose base64 contains + and / — the URL-safe
    // variant swaps them for - and _, which decodeToken must map back.
    const token = tokenWithPayload({ sub: "x", name: "ﬃ~ﬃ~ﬃ" });

    expect(decodeToken(token).name).toBe("ﬃ~ﬃ~ﬃ");
  });
});
