import { afterEach, describe, expect, mock, test } from "bun:test";
mock.module("server-only", () => ({}));
const { CookieApiAdapter, hydrateSession, hydrateUser } = await import("./cookieapi-adapter.ts");
const originalFetch = globalThis.fetch;
const originalToken = process.env.WEBSITE_SERVICE_TOKEN;
afterEach(() => { globalThis.fetch = originalFetch; process.env.WEBSITE_SERVICE_TOKEN = originalToken; });
describe("CookieAPI authentication adapter", () => {
  test("hydrates serialized Auth.js dates", () => {
    expect(hydrateSession({ sessionToken: "token", userId: "internal", expires: "2030-01-01" }).expires).toBeInstanceOf(Date);
    expect(hydrateUser({ id: "internal", email: "e@example.com", emailVerified: null }).emailVerified).toBeNull();
  });
  test("sends account identity as a provider tuple with a server credential", async () => {
    process.env.WEBSITE_SERVICE_TOKEN = "local-test-service";
    let request;
    let endpoint = "";
    globalThis.fetch = mock(async (input, init) => {
      endpoint = String(input); request = init;
      return Response.json({ id: "internal", email: null, emailVerified: null });
    });
    const user = await CookieApiAdapter().getUserByAccount({ provider: "discord", providerAccountId: "123" });
    expect(user?.id).toBe("internal");
    expect(endpoint.endsWith("/internal/auth/getUserByAccount")).toBe(true);
    expect(JSON.parse(String(request?.body))).toEqual({ data: { provider: "discord", providerAccountId: "123" } });
    expect(new Headers(request?.headers).get("Authorization")).toBe("Bearer local-test-service");
    expect(request?.cache).toBe("no-store");
  });
  test("fails closed when account persistence is unavailable", async () => {
    process.env.WEBSITE_SERVICE_TOKEN = "local-test-service";
    globalThis.fetch = mock(async () => new Response(null, { status: 503 }));
    await expect(CookieApiAdapter().getSessionAndUser("local-test-session")).rejects.toThrow("Account persistence failed (503)");
  });
});
