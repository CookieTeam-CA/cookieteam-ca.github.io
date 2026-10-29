import { expect, test } from "bun:test";

test("player adapters normalize no-cape values, bound wearer requests, and reject malformed history", () => {
  // Existing page tests mock this module; use a clean process to exercise the real adapters.
  const result = Bun.spawnSync([process.execPath, "--eval", `
    import assert from "node:assert/strict";
    import { getPlayer, getPlayersSorted, getPlayersByCape, getPlayerHistory, CapeApiError } from "./app/cookiecapes/lib/api.ts";
    let calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      return Response.json(url.includes("/get_player?") ? { cape_id: -1 }
        : { players: [{ current_cape_id: -1, cape_name: "old", cape_image_url: "old.png" }], total_count: 3000, limit: 24, offset: 24 });
    };
    assert.equal((await getPlayer("player")).current_cape_id, null);
    const list = await getPlayersSorted();
    assert.equal(list.players[0].current_cape_id, null);
    assert.equal(list.players[0].cape_image_url, null);
    calls = [];
    const wearers = await getPlayersByCape(42, 2);
    assert.equal(calls.length, 1);
    assert.equal(wearers.total_count, 3000);
    assert.equal(wearers.players.length, 1);
    assert.deepEqual(JSON.parse(calls[0].options.body), { limit: 24, offset: 24, sort_by: "minecraft_name", order: "asc", banned: false, cape_id: 42 });
    const valid = { uuid: "owner", current_username: "Player", country: null, username_history: [], skin_history: [], socials: [] };
    for (const malformed of [null, { ...valid, socials: "broken" }, { ...valid, socials: [null] }, { ...valid, username_history: [{}] }, { ...valid, skin_history: [{ hash: "x", changed_at: "today", slim: "yes" }] }, { ...valid, country: 7 }]) {
      globalThis.fetch = async () => Response.json(malformed);
      await assert.rejects(getPlayerHistory("Player"), CapeApiError);
    }
    globalThis.fetch = async () => Response.json(valid);
    assert.deepEqual(await getPlayerHistory("Player"), valid);
    globalThis.fetch = async () => new Response(null, { status: 404 });
    assert.equal(await getPlayerHistory("Player"), null);

    const { mock } = await import("bun:test");
    mock.module("@/app/cookiecapes/i18n/server", () => ({ getTranslations: async () => ({ t: key => key, locale: "en" }) }));
    mock.module("./app/cookiecapes/lib/cape-details.ts", () => ({ getCapeForDetails: async () => ({ cape_id: 42, cape_name: "Cape", minecraft_name: "Owner", last_edited: "2026-10-29" }) }));
    mock.module("./app/components/Footer.tsx", () => ({ default: () => null }));
    mock.module("./app/cookiecapes/components/CapeViewer.tsx", () => ({ default: () => null }));
    function Pagination() {}
    mock.module("./app/cookiecapes/components/Pagination.tsx", () => ({ default: Pagination }));
    const { default: page } = await import("./app/cookiecapes/capes/[id]/page.tsx");
    const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : [node];
    calls = [];
    let players = Array.from({ length: 24 }, (_, i) => ({ minecraft_uuid: String(i), minecraft_name: "Player" + i }));
    globalThis.fetch = async (_url, options) => { calls.push(JSON.parse(options.body)); return Response.json({ players, total_count: 3000, offset: 24, limit: 24 }); };
    const tree = nodes(await page({ params: Promise.resolve({ id: "42" }), searchParams: Promise.resolve({ page: "2" }) }));
    assert.equal(calls.length, 1);
    assert.equal(calls[0].offset, 24);
    assert.equal(tree.filter(node => node === 3000).length, 2);
    assert.deepEqual(tree.find(node => node?.type === Pagination).props, { currentPage: 2, totalCount: 3000, limit: 24 });
    players = [];
    const empty = nodes(await page({ params: Promise.resolve({ id: "42" }), searchParams: Promise.resolve({ page: "0" }) }));
    assert.equal(calls.at(-1).offset, 0);
    assert.ok(empty.includes("No players found."));
    assert.ok(!empty.includes("Nobody is wearing this cape right now."));
  `], { cwd: process.cwd(), stdout: "pipe", stderr: "pipe" });
  expect(new TextDecoder().decode(result.stderr)).toBe("");
  expect(result.exitCode).toBe(0);
});
