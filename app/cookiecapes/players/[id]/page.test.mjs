import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import { translations } from "../../i18n/messages";

const player = mock();
const history = mock();
const capes = mock();
const auth = mock();
const originalAdmins = process.env.ADMIN_DISCORD_IDS;
const originalToken = process.env.COOKIECAPES_API_TOKEN;
const originalFetch = globalThis.fetch;
mock.module("server-only", () => ({}));
mock.module("@/auth", () => ({ auth }));
mock.module("next/cache", () => ({ revalidatePath() {} }));
mock.module("@/app/cookiecapes/i18n/server", () => ({ getTranslations: async () => translations("en") }));
mock.module("../../lib/api", () => ({
  API_BASE_URL: "https://example.invalid", CapeApiError: class extends Error {}, capeApiError: mock(),
  getPlayer: player, getPlayerHistory: history, getCapesByPlayer: capes,
}));
mock.module("../../components/ProfileSkinDisplay", () => ({ default: () => null }));
mock.module("../../components/CapeCard", () => ({ default: () => null }));
mock.module("../../../components/Footer", () => ({ default: () => null }));
const { default: PlayerProfilePage } = await import("./page");
const { isCookieCapesAdmin, getCookieCapesAdmin } = await import("@/lib/cookiecapes-admin");
const { deleteCape } = await import("@/app/actions/cape-actions");
const { banPlayer } = await import("@/app/actions/player-actions");
const render = () => PlayerProfilePage({ params: Promise.resolve({ id: "ExistingPlayer" }) });
const text = node => Array.isArray(node) ? node.map(text).join(" ")
  : node?.props ? text(node.props.children) : typeof node === "string" ? node : "";

beforeEach(() => {
  player.mockReset().mockResolvedValue({ minecraft_name: "ExistingPlayer", minecraft_uuid: "owner", current_cape_id: null });
  history.mockReset().mockResolvedValue(null);
  capes.mockReset().mockResolvedValue([]);
  auth.mockReset().mockResolvedValue(null);
});
afterAll(() => {
  if (originalAdmins === undefined) delete process.env.ADMIN_DISCORD_IDS;
  else process.env.ADMIN_DISCORD_IDS = originalAdmins;
  if (originalToken === undefined) delete process.env.COOKIECAPES_API_TOKEN;
  else process.env.COOKIECAPES_API_TOKEN = originalToken;
  globalThis.fetch = originalFetch;
});

test("history failures leave an existing profile available with an explicit notice", async () => {
  for (const error of [new Error("HTTP 503"), new DOMException("Timeout", "TimeoutError"), new SyntaxError("Invalid JSON")]) {
    history.mockRejectedValue(error);
    const page = text(await render());
    expect(page).toContain("Profile details");
    expect(page).toContain("Player history is temporarily unavailable.");
    expect(capes).toHaveBeenCalledWith("owner");
  }
});

test("history absence keeps not-found behavior, while provider failure is not a false not-found", async () => {
  expect(text(await render())).not.toContain("Player history is temporarily unavailable.");
  player.mockResolvedValue(null);
  expect(text(await render())).toContain("Player not found");
  const error = new Error("Provider unavailable");
  history.mockRejectedValue(error);
  await expect(render()).rejects.toBe(error);
});

test("admin policy trims IDs and still rejects missing and unlisted identities", async () => {
  process.env.ADMIN_DISCORD_IDS = "111, 222 ";
  expect(isCookieCapesAdmin({ discordId: "222" })).toBe(true);
  expect(isCookieCapesAdmin({ discordId: "333" })).toBe(false);
  expect(isCookieCapesAdmin(undefined)).toBe(false);
  expect(isCookieCapesAdmin({ discordId: "" })).toBe(false);
  auth.mockResolvedValue({ user: { id: "account", discordId: "222" } });
  expect(await getCookieCapesAdmin()).toBe(true);
  auth.mockResolvedValue({ user: { discordId: "222" } });
  expect(await getCookieCapesAdmin()).toBe(false);
});

test("moderation actions share the trimmed policy and reject other users before fetching", async () => {
  process.env.ADMIN_DISCORD_IDS = "111, 222 ";
  process.env.COOKIECAPES_API_TOKEN = "test-only";
  const fetch = mock(async () => Response.json({}));
  globalThis.fetch = fetch;
  auth.mockResolvedValue({ user: { id: "account", discordId: "222" } });
  expect(await deleteCape(2)).toEqual({ success: true });
  expect(await banPlayer("ExistingPlayer", "Test reason")).toEqual({ success: true });
  expect(fetch).toHaveBeenCalledTimes(2);
  auth.mockResolvedValue({ user: { id: "other", discordId: "333" } });
  expect((await deleteCape(2)).success).toBe(false);
  expect((await banPlayer("ExistingPlayer", "Test reason")).success).toBe(false);
  expect(fetch).toHaveBeenCalledTimes(2);
});

test("public admin controls tolerate session-service failures while moderation stays strict", async () => {
  auth.mockRejectedValue(new Error("Session service unavailable"));
  expect(await getCookieCapesAdmin()).toBe(false);
  globalThis.fetch = mock();
  await expect(deleteCape(2)).rejects.toThrow("Session service unavailable");
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
