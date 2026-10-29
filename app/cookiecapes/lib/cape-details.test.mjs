import { beforeEach, expect, mock, test } from "bun:test";

class CapeApiError extends Error {
  constructor(status) { super(`HTTP ${status}`); this.status = status; }
}
const publicCape = mock();
const account = mock();
mock.module("server-only", () => ({}));
const api = await import("./api");
mock.module("./api", () => ({ ...api, CapeApiError, getCape: publicCape }));
mock.module("@/lib/cookieapi-account", () => ({ accountJson: account }));
const { getCapeForDetails } = await import("./cape-details.ts");

beforeEach(() => { publicCape.mockReset(); account.mockReset(); });

test("public cape links keep public data and avoid account requests", async () => {
  const cape = { cape_id: 2, cape_name: "Public", cape_image_url: "https://example.invalid/2.png" };
  publicCape.mockResolvedValue(cape);
  expect(await getCapeForDetails(2)).toEqual(cape);
  expect(account).not.toHaveBeenCalled();
});

test("private details require ownership and use the authenticated image proxy", async () => {
  publicCape.mockRejectedValue(new CapeApiError(401));
  const cape = { cape_id: 3, cape_name: "Private", is_private: true, hidden_at: null, last_edited: "2026-10-28" };
  account.mockImplementation(path => Promise.resolve(path === "/account/me" ? { links: [{ minecraft_uuid: "owner" }] } : { capes: [cape] }));
  const result = await getCapeForDetails(3);
  expect(result.is_private).toBe(true);
  expect(result.cape_image_url).toStartWith("/cookiecapes/account/images/3?");
  expect(await getCapeForDetails(4)).toBeNull();
  cape.hidden_at = "2026-10-28";
  expect(await getCapeForDetails(3)).toBeNull();
  account.mockRejectedValue(new Error("Sign in required"));
  expect(await getCapeForDetails(3)).toBeNull();
});

test("detail lookups preserve upstream failures", async () => {
  publicCape.mockRejectedValue(new CapeApiError(503));
  await expect(getCapeForDetails(3)).rejects.toMatchObject({ status: 503 });
  expect(account).not.toHaveBeenCalled();
});
