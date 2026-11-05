import { describe, expect, test } from "bun:test";
import { capeApiError } from "./api";
import { actionValue } from "./account-types";

describe("duplicate cape errors", () => {
  test("preserves structured identity through API parsing and action serialization", async () => {
    const error = await capeApiError(Response.json({ detail: "Duplicate", code: "duplicate_cape", existing_cape_id: 42 }, { status: 409 }));
    expect(error.code).toBe("duplicate_cape");
    expect(error.existingCapeId).toBe(42);
    const result = JSON.parse(JSON.stringify({ error: error.message, code: error.code, existingCapeId: error.existingCapeId }));
    try { actionValue(result); throw new Error("Expected rejection"); }
    catch (cause) { expect(cause).toMatchObject({ code: "duplicate_cape", existingCapeId: 42 }); }
  });
  test("ordinary conflicts and malformed IDs retain generic fallback", async () => {
    for (const data of [{ detail: "Restore first" }, { code: "duplicate_cape", existing_cape_id: "42" }, { code: "duplicate_cape", existing_cape_id: -1 }, { code: "duplicate_cape", existing_cape_id: 1.5 }]) {
      const error = await capeApiError(Response.json(data, { status: 409 }));
      expect(error.code).toBeUndefined();
      expect(error.existingCapeId).toBeUndefined();
    }
    expect((await capeApiError(new Response("bad JSON", { status: 409 }))).code).toBeUndefined();
  });
});
