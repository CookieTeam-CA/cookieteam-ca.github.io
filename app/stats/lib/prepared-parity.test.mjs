import test from "node:test";
import assert from "node:assert/strict";
import fixture from "./fixtures/prepared.json" with { type: "json" };
import { calculateScores } from "./scoring.ts";
import { legacySnapshot } from "./snapshot-adapter.ts";
import { sortRows } from "./collections.ts";

const legacy = legacySnapshot(fixture.prepared.raw);
const oracle = calculateScores(legacy.players);
const response = path => fixture.responses.find(item => item.path === path).body;

test("prepared backend scoring, all ranks and awards match the independent website oracle", () => {
  assert.deepEqual(fixture.prepared.scored.players, oracle.players.map(player => ({
    uuid: player.uuid, username: player.username, points: player.points, stat_points: player.statPoints,
    advancement_points: player.advancementPoints, rank: player.rank, awards: player.awards,
  })));
  assert.deepEqual(fixture.prepared.scored.stat_boards, Object.fromEntries(oracle.statBoards));
  assert.deepEqual(fixture.prepared.scored.advancement_boards, Object.fromEntries(oracle.advancementBoards));
  assert.equal(oracle.statBoards.has("null"), false);
  assert.equal(oracle.advancementBoards.has("mod:recipes/stone"), false);
  assert.equal(oracle.advancementBoards.has("minecraft:recipes/stone"), false);
});

function rowsFor(path) {
  if (path === "/ca6/stats") return legacy.stats.map(info => {
    const board = oracle.statBoards.get(info.id) ?? [];
    return { ...info, name: info.display_name, participants: board.length, value: board[0]?.value ?? 0 };
  });
  if (path === "/ca6/advancements") return legacy.advancements.map(info => ({ ...info, name: info.display_name, category: info.tab, participants: (oracle.advancementBoards.get(info.id) ?? []).length }));
  if (path === "/ca6/leaderboards/points" || path === "/ca6/players/directory") return oracle.players.map(player => ({ ...player, id: player.uuid, name: player.username, value: path.endsWith("points") ? player.points : player.advancements.length }));
  if (path.startsWith("/ca6/players/")) {
    const profile = fixture.prepared.profiles.u00;
    return { stats: profile.stats.map(item => ({ ...item, name: item.display_name, rank: item.rank ?? undefined })),
      advancements: profile.advancements.map(item => ({ ...item, name: item.display_name, category: item.tab, time: item.display_unlocked_at ?? undefined, rank: item.rank ?? undefined })) };
  }
  const board = path.endsWith("stats") ? oracle.statBoards.get("minecraft:custom/minecraft:jump") : oracle.advancementBoards.get("minecraft:story/mine_stone");
  return board.map(entry => ({ ...entry, id: entry.uuid, name: entry.username, time: entry.completed_at }));
}

function expectedCollection(rows, params, prefix = "", defaultSort = "name_asc", defaultLimit = 15) {
  const q = (params.get(prefix + "q") ?? "").trim().toLowerCase();
  const category = params.get(prefix + "category");
  const exclude = params.getAll(prefix + "exclude");
  const categories = [...new Set(rows.map(row => row.category).filter(Boolean))].sort();
  const filtered = sortRows(rows.filter(row => (!category || row.category === category) && (!row.category || !exclude.includes(row.category)) && (!q || `${row.name} ${row.id} ${row.searchText ?? ""}`.toLowerCase().includes(q))), params.get(prefix + "sort") ?? defaultSort);
  const limit = Number(params.get(prefix + "limit") ?? defaultLimit);
  const total_pages = Math.ceil(filtered.length / limit);
  const page = Math.min(Number(params.get(prefix + "page") ?? 1), total_pages || 1);
  return { ids: filtered.slice((page - 1) * limit, page * limit).map(row => row.id), categories, page, limit, total: filtered.length, total_pages };
}
function compareCollection(actual, expected) {
  assert.deepEqual(actual.items.map(item => item.id ?? item.uuid), expected.ids);
  for (const key of ["categories", "page", "limit", "total", "total_pages"]) assert.deepEqual(actual[key], expected[key], key);
}

test("API collections match former website filters, every supported sort, exclusions and pagination", () => {
  for (const result of fixture.responses) {
    if (result.status !== 200) continue;
    const url = new URL(result.path, "http://fixture");
    if (url.pathname === "/ca6/players/u00/profile") {
      const rows = rowsFor(url.pathname);
      compareCollection(result.body.stats, expectedCollection(rows.stats, url.searchParams, "stats_", "value_desc", 8));
      compareCollection(result.body.advancements, expectedCollection(rows.advancements, url.searchParams, "advancements_", "time_desc", 8));
    } else if (result.body.items && !(url.searchParams.get("key") ?? "").endsWith("empty")) {
      const defaultSort = url.pathname.includes("leaderboards") ? "rank_asc" : url.pathname.includes("directory") ? "points_desc" : "name_asc";
      compareCollection(result.body, expectedCollection(rowsFor(url.pathname), url.searchParams, "", defaultSort));
    }
  }
});

test("global ranks, top3 and complete summaries are independent of displayed pages", () => {
  const points = response("/ca6/leaderboards/points?sort=rank_desc&limit=3&page=2");
  assert.deepEqual(points.top3.map(item => item.uuid), oracle.players.slice(0, 3).map(item => item.uuid));
  assert.deepEqual(points.items.map(item => item.rank), [9, 8, 7]);
  const board = response("/ca6/leaderboards/stats?key=minecraft:custom/minecraft:jump&sort=rank_desc&limit=3&page=2");
  const entries = oracle.statBoards.get("minecraft:custom/minecraft:jump");
  assert.equal(board.summary.sum, entries.reduce((sum, entry) => sum + entry.value, 0));
  assert.equal(board.summary.participants, entries.length);
  assert.equal(board.summary.maximum, entries[0].value);
});

test("profile compatibility preserves raw/legacy progress, duplicates, display/scoring times and name collisions", () => {
  const profile = response("/ca6/players/u00/profile");
  assert.equal(profile.raw_advancement_count, 7);
  assert.equal(profile.legacy_advancement_count, 6);
  assert.equal(profile.visible_advancement_total, 3);
  assert.equal(profile.completion_percentage, 200);
  assert.equal(profile.stats.limit, 8);
  assert.equal(profile.advancements.limit, 8);
  const advancement = profile.advancements.items.find(item => item.id === "minecraft:story/mine_stone");
  assert.equal(advancement.completed, true);
  assert.notEqual(advancement.display_unlocked_at, advancement.scoring_unlocked_at);
  const invalid = profile.advancements.items.find(item => item.id.endsWith("invalid"));
  assert.equal(invalid.completed, true);
  assert.equal(invalid.display_unlocked_at, null);
  assert.equal(invalid.scoring_unlocked_at, null);
  assert.equal(invalid.rank, null);
  const bestAnna = oracle.players.find(player => player.username.toLowerCase() === "anna");
  assert.equal(response("/ca6/players/aNnA/profile").uuid, bestAnna.uuid);
  const uuid = oracle.players.find(player => player.uuid === "u00");
  const name = oracle.players.find(player => player.username === "u00");
  assert.equal(profile.uuid, uuid.rank < name.rank ? uuid.uuid : name.uuid);
});

test("empty resources remain renderable; unknown resources and recipes are 404", () => {
  for (const path of ["/ca6/leaderboards/stats?key=minecraft:used/minecraft:empty", "/ca6/leaderboards/advancements?key=minecraft:adventure/empty"]) {
    const body = response(path);
    assert.deepEqual(body.items, []); assert.equal(body.total, 0); assert.equal(body.total_pages, 0); assert.equal(body.page, 1);
    assert.equal(body.summary.participants, 0);
  }
  assert.equal(response("/ca6/players/u11/profile").stats.total, 0);
  assert.equal(response("/ca6/players/u11/profile").last_sync, null);
  for (const result of fixture.responses.filter(item => item.status !== 200)) assert.ok([400, 404, 409].includes(result.status) && result.body.error.code && result.body.error.request_id);
});
