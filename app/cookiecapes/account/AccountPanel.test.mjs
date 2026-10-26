import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
let loadResult;
let reviewResult;
let claimResult;
const load = mock(async () => loadResult);
const review = mock(async () => reviewResult);
const claim = mock(async () => claimResult);
mock.module("@/app/actions/account-actions", () => ({
  loadOwnedCapes: load, reviewLegacyCapes: review, claimCape: claim,
  startMinecraftLink: async () => ({ value: { url: "https://example.invalid" } }),
  uploadWebsiteCape: async () => ({ value: undefined }),
}));
mock.module("next/link", () => ({ default: ({ children, href, ...props }) => createElement("a", { href, ...props }, children) }));
const { default: AccountPanel } = await import("./AccountPanel.tsx");
const account = { user: { id: "internal", name: "User" }, links: [{ minecraft_uuid: "uuid", minecraft_name: "Player" }], mcid_enabled: false };
const cape = (id, extra = {}) => ({ cape_id: id, cape_name: `Cape ${id}`, verification: "unverified", hidden_at: null, delete_after: null, ...extra });
const initial = () => ({ value: { capes: [cape(2), cape(3), cape(4, { hidden_at: "2026-10-22", delete_after: "2026-11-21" })], review: { id: "review", snapshot: [{ cape_id: 2, revision: 0 }, { cape_id: 3, revision: 0 }] } } });
let dom;
let root;
beforeEach(() => {
  dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "http://localhost" });
  globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  load.mockClear(); review.mockClear(); claim.mockClear();
  loadResult = initial(); reviewResult = { value: undefined }; claimResult = { value: undefined };
  root = createRoot(document.getElementById("root"));
});
afterEach(async () => { await act(async () => root.unmount()); dom.window.close(); delete globalThis.window; delete globalThis.document; delete globalThis.HTMLElement; delete globalThis.IS_REACT_ACT_ENVIRONMENT; });
const mount = async () => { await act(async () => root.render(createElement(AccountPanel, { account }))); };
const button = text => [...document.querySelectorAll("button")].find(node => node.textContent === text);
const click = async node => { await act(async () => node.click()); };
test("legacy review requires confirmation and cancel makes no mutation", async () => {
  await mount();
  expect(document.body.textContent).toContain("2 behalten · 0 entfernen");
  await click(button("Auswahl prüfen"));
  expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
  expect(review).not.toHaveBeenCalled();
  await click(button("Abbrechen"));
  expect(document.querySelector('[role="alertdialog"]')).toBeNull();
  expect(review).not.toHaveBeenCalled();
});
test("failed review retains selection and exposes safe actionable API error", async () => {
  reviewResult = { error: "Die Auswahl ist veraltet. Bitte erneut laden." };
  await mount();
  await click(document.querySelector('input[type="checkbox"]'));
  expect(document.body.textContent).toContain("1 behalten · 1 entfernen");
  await click(button("Auswahl prüfen"));
  await click(button("Auswahl bestätigen"));
  expect(review).toHaveBeenCalledWith("review", [3]);
  expect(document.querySelector('[role="alert"]').textContent).toContain("Die Auswahl ist veraltet");
  expect(document.querySelector('input[type="checkbox"]').checked).toBe(false);
});
test("load failures stop loading state and retry can recover", async () => {
  loadResult = { error: "Dienst vorübergehend nicht verfügbar." };
  await mount();
  expect(document.body.textContent).not.toContain("Capes werden geladen…");
  expect(button("Erneut laden")).toBeDefined();
  loadResult = initial();
  await click(button("Erneut laden"));
  expect(document.body.textContent).toContain("Cape 2");
  expect(button("Erneut laden")).toBeUndefined();
});
test("restoration errors preserve the hidden cape and recovery controls", async () => {
  claimResult = { error: "Die Wiederherstellungsfrist ist abgelaufen." };
  await mount();
  await click(button("Wiederherstellen"));
  expect(claim).toHaveBeenCalledWith(4, true);
  expect(document.querySelector('[role="alert"]').textContent).toContain("Wiederherstellungsfrist");
  expect(button("Wiederherstellen")).toBeDefined();
  expect(document.body.textContent).toContain("Verborgen. Löschung:");
});
