import test from "node:test";
import assert from "node:assert/strict";
import { calculateScores, rankEntries, rankPoints } from "./scoring.ts";

test("statistics award 5/3/1 and achievements award 5/3/3", () => {
  assert.deepEqual([1, 2, 3, 4].map(rank => rankPoints(rank)), [5, 3, 1, 0]);
  assert.deepEqual([1, 2, 3, 4].map(rank => rankPoints(rank, true)), [5, 3, 3, 0]);
});

test("scores add every podium independently and use earliest achievement timestamps", () => {
  const players = ["Anna", "Ben", "Clara", "David"].map((username, index) => ({
    uuid: String(index), username, stats: { jumps: 40 - index * 10, mined: index + 1, zero: 0, negative: -1 },
    advancements: [{ achievement: "story/stone", display_name: "Stone", unlocked_at: `2026-07-24T12:0${3 - index}:00Z` }],
  }));
  const result = calculateScores(players);
  assert.deepEqual(result.statBoards.get("jumps").map(entry => entry.points), [5, 3, 1, 0]);
  assert.deepEqual(result.advancementBoards.get("story/stone").map(entry => entry.username), ["David", "Clara", "Ben", "Anna"]);
  assert.equal(result.players.find(player => player.username === "David").points, 10);
  assert.equal(result.players.find(player => player.username === "Clara").points, 7);
  assert.equal(result.players.find(player => player.username === "Ben").points, 7);
  assert.equal(result.players.find(player => player.username === "Anna").points, 5);
  assert.equal(result.statBoards.has("zero"), false);
  assert.equal(result.statBoards.has("negative"), false);
  for (const player of result.players) assert.equal(player.points, player.awards.reduce((sum, award) => sum + award.points, 0));
});

test("equal values are deterministic regardless of fetch completion order", () => {
  const entries = [{ uuid: "b", username: "Ben", value: 10 }, { uuid: "a", username: "Anna", value: 10 }];
  assert.deepEqual(rankEntries(entries), rankEntries([...entries].reverse()));
  assert.equal(rankEntries(entries)[0].username, "Anna");
});

test("invalid timestamps, duplicate achievements and recipes cannot grant points", () => {
  const result = calculateScores([{ uuid: "a", username: "Anna", stats: { bad: NaN }, advancements: [
    { achievement: "story/stone", display_name: "Stone", unlocked_at: "2026-07-24T12:00:00Z" },
    { achievement: "story/stone", display_name: "Stone", unlocked_at: "2026-07-24T12:00:00Z" },
    { achievement: "story/bad", display_name: "Bad", unlocked_at: "invalid" },
    { achievement: "minecraft:recipes/stone", display_name: "Recipe", unlocked_at: "2026-07-24T12:00:00Z" },
  ] }]);
  assert.equal(result.players[0].points, 5);
  assert.equal(result.advancementBoards.size, 1);
  assert.equal(result.statBoards.size, 0);
});
