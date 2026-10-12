import assert from "node:assert/strict";
import { test } from "node:test";
import { createSnapshotCache } from "./snapshot-cache.ts";

test("readers share a complete snapshot until the five-minute boundary", async () => {
  let now = 0, calls = 0;
  const get = createSnapshotCache(async () => ({ version: ++calls }), 300000, () => now);
  const first = await get();
  now = 299999;
  assert.equal(await get(), first);
  now = 300000;
  assert.deepEqual(await get(), { version: 2 });
  assert.equal(calls, 2);
});

test("concurrent expired readers wait for one refresh and never receive stale data", async () => {
  let now = 0, calls = 0, complete;
  const get = createSnapshotCache(async () => {
    calls++;
    return calls === 1 ? { version: 1 } : new Promise(resolve => { complete = resolve; });
  }, 300000, () => now);
  await get();
  now = 300000;
  let resolved = false;
  const readers = [get().then(value => { resolved = true; return value; }), get(), get()];
  await Promise.resolve();
  assert.equal(resolved, false);
  assert.equal(calls, 2);
  complete({ version: 2 });
  const values = await Promise.all(readers);
  assert.ok(values.every(value => value === values[0]));
  assert.deepEqual(values[0], { version: 2 });
});

test("a failed refresh rejects all readers and permits a clean retry", async () => {
  let calls = 0, now = 0;
  const get = createSnapshotCache(async () => {
    calls++;
    if (calls === 2) throw new Error("incomplete upstream snapshot");
    return { version: calls };
  }, 300000, () => now);
  await get();
  now = 300000;
  const values = await Promise.allSettled([get(), get()]);
  assert.ok(values.every(value => value.status === "rejected"));
  assert.equal(calls, 2);
  assert.deepEqual(await get(), { version: 3 });
});
