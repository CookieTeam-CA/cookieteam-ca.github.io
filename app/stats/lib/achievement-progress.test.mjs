import test from "node:test";
import assert from "node:assert/strict";
import { achievementPercentage, CA6_ACHIEVEMENT_TOTAL } from "./achievement-progress.ts";

test("CA6 progress uses all 126 achievements independently of the recorded catalog", () => {
  assert.equal(CA6_ACHIEVEMENT_TOTAL, 126);
  assert.equal(achievementPercentage(0), 0);
  assert.equal(achievementPercentage(63), 50);
  assert.equal(achievementPercentage(101), 101 / 126 * 100);
  assert.equal(achievementPercentage(126), 100);
  assert.equal(achievementPercentage(252), 200);
});
