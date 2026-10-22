import { afterEach, expect, mock, test } from "bun:test";
mock.module("server-only", () => ({}));
let cookieToken = "local-session";
mock.module("next/headers", () => ({ cookies: async () => ({ get: () => cookieToken ? { value: cookieToken } : undefined }) }));
const { accountFetch } = await import("./cookieapi-account.ts");
const originalFetch = globalThis.fetch;
const originalToken = process.env.WEBSITE_SERVICE_TOKEN;
afterEach(() => { globalThis.fetch = originalFetch; cookieToken = "local-session"; process.env.WEBSITE_SERVICE_TOKEN = originalToken; });
test("account requests require the actual browser session cookie", async () => {
  cookieToken = undefined;
  const fetch = mock(async () => Response.json({}));
  globalThis.fetch = fetch;
  await expect(accountFetch("/account/me")).rejects.toThrow("Bitte melde dich erneut an.");
  expect(fetch).not.toHaveBeenCalled();
});
test("forwards the session privately alongside the separate service credential", async () => {
  process.env.WEBSITE_SERVICE_TOKEN = "local-service";
  let request;
  globalThis.fetch = mock(async (_url, init) => { request = init; return Response.json({}); });
  await accountFetch("/account/me", { headers: { Authorization: "untrusted", "X-Website-Session": "forged" } });
  expect(request.redirect).toBe("error");
  expect(new Headers(request.headers).get("X-Website-Session")).toBe("local-session");
  expect(new Headers(request.headers).get("Authorization")).toBe("Bearer local-service");
  expect(request.cache).toBe("no-store");
});
test("expired API sessions fail instead of serving stale account data", async () => {
  process.env.WEBSITE_SERVICE_TOKEN = "local-service";
  globalThis.fetch = mock(async () => Response.json({ detail: "Session expired" }, { status: 401 }));
  await expect(accountFetch("/account/me")).rejects.toThrow("Die Anmeldung fehlt");
});
