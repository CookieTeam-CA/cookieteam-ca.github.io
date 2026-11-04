import { afterEach, expect, mock, test } from "bun:test";
import { translations } from "../../i18n/messages";

mock.module("server-only", () => ({}));
mock.module("../../i18n/server", () => ({ getTranslations: async () => translations("en") }));
mock.module("../../../components/Footer", () => ({ default: () => null }));
mock.module("../../components/CapeCard", () => ({ default: () => null }));
const { default: PlayerProfilePage } = await import("./page");
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

function capeResponse(status) {
  globalThis.fetch = async url => {
    const path = new URL(url).pathname;
    if (path === "/get_player") return Response.json({ minecraft_uuid: "a".repeat(32), minecraft_name: "Player", cape_id: 77, banned: false });
    if (path === "/list_capes_sorted") return Response.json({ capes: [], total_count: 0, offset: 0 });
    if (path.startsWith("/api/history/")) return new Response(null, { status: 404 });
    if (path === "/get_cape") return Response.json({ detail: "Cape unavailable" }, { status });
    throw new Error(`Unexpected request: ${url}`);
  };
}

test("private or missing equipped capes do not prevent rendering a player profile", async () => {
  for (const status of [401, 403, 404]) {
    capeResponse(status);
    const page = await PlayerProfilePage({ params: Promise.resolve({ id: "Player" }) });
    expect(page.type).toBe("main");
  }
});

test("equipped cape service failures still surface", async () => {
  capeResponse(503);
  await expect(PlayerProfilePage({ params: Promise.resolve({ id: "Player" }) })).rejects.toMatchObject({ status: 503 });
});
