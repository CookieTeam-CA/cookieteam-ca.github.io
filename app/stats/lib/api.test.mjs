import test from "node:test";
import assert from "node:assert/strict";
import { legacySnapshot } from "./snapshot-adapter.ts";
import { collectionQuery, profileQuery, sorts } from "./prepared-query.ts";
import { createPreparedClient, StatsApiError, versionedSequence } from "./prepared-cache.ts";

test("snapshot reproduces legacy recipe input, shared descriptions and nullable fields", () => {
  const raw = { stats: [], advancements: [
    { id: "minecraft:story/stone", description: "Description", tab: "story" },
    { id: "mod:recipes/stone" }, { id: "minecraft:recipes/stone" },
  ], players: [{ uuid: "a", username: "Anna", last_sync: null, stats: { null: null, zero: 0, positive: 20 },
    advancements: ["minecraft:story/stone", "minecraft:story/stone", "mod:recipes/stone", "minecraft:recipes/stone"].map(achievement => ({ achievement, unlocked_at: "invalid" })) }] };
  const data = legacySnapshot(raw);
  assert.equal(data.players[0].advancements.length, 3);
  assert.equal(data.players[0].advancements[0].description, "Description");
  assert.equal(data.advancements.length, 1);
  assert.equal(data.players[0].last_sync, undefined);
  assert.deepEqual(data.players[0].stats, { zero: 0, positive: 20 });
});

test("every supported sort survives normalization; invalid website scalars use defaults", () => {
  for (const options of Object.values(sorts)) for (const sort of options) assert.equal(collectionQuery({ sort }, options, options[0]).get("sort"), sort);
  for (const page of ["bad", "0", "-1", "1.2", "Infinity", "9007199254740992", ["1", "2"]]) assert.equal(collectionQuery({ page }, sorts.stats, "name_asc").get("page"), "1");
  assert.equal(collectionQuery({ sort: ["name_desc"], search: ["a"], category: ["b"] }, sorts.stats, "name_asc").get("sort"), "name_asc");
  assert.equal(collectionQuery({ page: "2e2", limit: "999", sort: "wrong" }, sorts.stats, "name_asc").get("page"), "200");
  assert.equal(collectionQuery({ limit: "999" }, sorts.stats, "name_asc").get("limit"), "15");
});

test("search, repeated exclusions, profile sections and full namespaced keys", () => {
  const params = profileQuery({ search: " Jump ", category: "custom", exclude: ["mined", "crafted"], page: "3", view: "list",
    achievements_search: "Stone", achievements_sort: "completed_asc", achievements_page: "2", achievements_exclude: ["nether", "end"], achievements_view: "cards", unknown: "ignored" });
  assert.equal(params.get("stats_q"), "jump");
  assert.equal(params.get("advancements_q"), "stone");
  assert.deepEqual(params.getAll("stats_exclude"), ["mined", "crafted"]);
  assert.deepEqual(params.getAll("advancements_exclude"), ["nether", "end"]);
  assert.equal(params.get("stats_page"), "3");
  assert.equal(params.get("advancements_page"), "2");
  assert.equal(params.get("stats_limit"), "8");
  assert.equal(params.get("advancements_limit"), "8");
  assert.ok(!params.toString().includes("view"));
  const key = "minecraft:custom/mod:folder/a+b & c";
  assert.equal(new URLSearchParams(new URLSearchParams({ key }).toString()).get("key"), key);
});

const headers = (time, version = "v1", etag = 'W/"one"') => ({ "X-Snapshot-Validated-At": new Date(time).toISOString(), "X-Snapshot-Version": version, ETag: etag });
test("expiry uses source age; required refresh is shared and failures never serve expired data", async () => {
  let now = 240000, calls = 0, finish;
  const client = createPreparedClient("http://test", 300000, async () => {
    calls++;
    if (calls === 2) return await new Promise(resolve => { finish = resolve; });
    return Response.json({ snapshot_version: "v1" }, { headers: headers(0) });
  }, () => now);
  const first = await client.get("/ca6/stats");
  now = 299999;
  assert.equal(await client.get("/ca6/stats"), first);
  now = 300000;
  const readers = [client.get("/ca6/stats"), client.get("/ca6/stats")];
  assert.equal(calls, 2);
  finish(Response.json({ error: { code: "snapshot_unavailable", message: "Unavailable", request_id: "r" } }, { status: 503 }));
  for (const result of await Promise.allSettled(readers)) { assert.equal(result.status, "rejected"); assert.equal(result.reason.status, 503); assert.equal(result.reason.requestId, "r"); }
  now = 240000;
  await client.get("/ca6/stats", undefined, true);
  assert.equal(calls, 3);
});

test("304 is processed before ok and extends freshness only from observation time", async () => {
  let now = 0, calls = 0;
  const client = createPreparedClient("http://test", 300000, async (_url, options) => {
    calls++;
    if (calls === 1) return Response.json({ snapshot_version: "v1", items: [] }, { headers: headers(0) });
    assert.equal(options.headers["If-None-Match"], 'W/"one"');
    return new Response(null, { status: 304, headers: headers(100000) });
  }, () => now);
  const first = await client.get("/ca6/stats");
  now = 300000;
  assert.equal(await client.get("/ca6/stats"), first);
  now = 399999;
  assert.equal(await client.get("/ca6/stats"), first);
  now = 400000;
  await assert.rejects(client.get("/ca6/stats"), /fresh source/);
});

test("resources, effective queries and pinned versions have separate representations", async () => {
  let calls = 0;
  const client = createPreparedClient("http://test", 300000, async url => { calls++; const version = new URL(url).searchParams.get("snapshot_version") ?? "v1"; return Response.json({ snapshot_version: version }, { headers: headers(0, version) }); }, () => 1);
  for (const [resource, query] of [["stats", "page=1&q=a"], ["stats", "q=a&page=1"], ["stats", "page=2&q=a"], ["advancements", "page=1&q=a"], ["stats", "page=1&q=a&snapshot_version=v2"]]) await client.get(`/ca6/${resource}`, new URLSearchParams(query));
  assert.equal(calls, 4);
});

test("structured errors propagate; 409 restarts the complete sequence with bounded retries", async () => {
  const forceValues = [];
  const result = await versionedSequence(async force => { forceValues.push(force); if (!force) throw new StatsApiError(409, "snapshot_conflict", "Expired"); return "fresh"; });
  assert.equal(result, "fresh"); assert.deepEqual(forceValues, [false, true]);
  let calls = 0;
  await assert.rejects(versionedSequence(async () => { calls++; throw new StatsApiError(409, "conflict", "Expired"); }), error => error.status === 409);
  assert.equal(calls, 3);
  for (const status of [400, 404, 409, 503]) {
    const client = createPreparedClient("http://test", 300000, async () => Response.json({ error: { code: "code", message: "Message", request_id: "id" } }, { status }));
    await assert.rejects(client.get("/ca6/stats"), error => error.status === status && error.code === "code" && error.requestId === "id");
  }
});

test("expired reads recover after a network failure; unmatched 304 and missing validation reject", async () => {
  let now = 0, calls = 0;
  const client = createPreparedClient("http://test", 300000, async () => {
    calls++;
    if (calls === 2) throw new Error("Connection failed");
    return Response.json({ snapshot_version: "v1" }, { headers: headers(now) });
  }, () => now);
  await client.get("/ca6/stats");
  now = 300000;
  await assert.rejects(client.get("/ca6/stats"), /Connection failed/);
  await client.get("/ca6/stats");
  assert.equal(calls, 3);
  for (const response of [new Response(null, { status: 304, headers: headers(0) }), Response.json({ snapshot_version: "v1" })]) {
    const invalid = createPreparedClient("http://test", 300000, async () => response, () => 0);
    await assert.rejects(invalid.get("/ca6/stats"));
  }
});

test("version conflicts force a new root representation and discard the old related sequence", async () => {
  const paths = [];
  let rootCalls = 0;
  const client = createPreparedClient("http://test", 300000, async url => {
    const parsed = new URL(url); paths.push(parsed.pathname + parsed.search);
    if (parsed.pathname.endsWith("overview")) {
      const version = ++rootCalls === 1 ? "old" : "new";
      return Response.json({ snapshot_version: version }, { headers: headers(0, version) });
    }
    const pin = parsed.searchParams.get("snapshot_version");
    if (pin === "old") return Response.json({ error: { code: "conflict", message: "Old expired", request_id: "r" } }, { status: 409 });
    return Response.json({ snapshot_version: pin }, { headers: headers(0, pin) });
  }, () => 1);
  const result = await versionedSequence(async force => {
    const root = await client.get("/ca6/overview", undefined, force);
    const related = await client.get("/ca6/leaderboards/stats", new URLSearchParams({ snapshot_version: root.snapshot_version }), force);
    return [root, related];
  });
  assert.ok(result.every(value => value.snapshot_version === "new"));
  assert.deepEqual(paths, ["/ca6/overview", "/ca6/leaderboards/stats?snapshot_version=old", "/ca6/overview", "/ca6/leaderboards/stats?snapshot_version=new"]);
});
