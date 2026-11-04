import { afterEach, expect, mock, spyOn, test } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

const session = { user: { discordId: "123", name: "Player" } };
mock.module("../../auth", () => ({ auth: async () => session }));
mock.module("./auth-actions", () => ({ login: async () => {} }));
const { checkRegistration, registerUser, unregisterUser, verifyMinecraftAccount } = await import("./user-registration-actions");
const { default: SetupWizard } = await import("../components/SetupWizard");
const { default: StaticPreview } = await import("../cookiecapes/components/StaticPreview");
const originalFetch = globalThis.fetch;
const originalGlobals = Object.fromEntries(["window", "document", "sessionStorage", "IS_REACT_ACT_ENVIRONMENT", "matchMedia", "IntersectionObserver"]
  .map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
let root, dom;

afterEach(async () => {
  if (root) await act(() => root.unmount());
  root = undefined;
  dom?.window.close();
  dom = undefined;
  for (const [key, descriptor] of Object.entries(originalGlobals)) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
  globalThis.fetch = originalFetch;
  mock.restore();
});

test("only a missing user means unregistered; outages remain unknown", async () => {
  for (const [status, registered] of [[200, true], [404, false], [401, null], [503, null]]) {
    globalThis.fetch = async () => new Response(null, { status });
    const result = await checkRegistration();
    expect(result.registered).toBe(registered);
    expect(Boolean(result.error)).toBe(registered === null);
  }
  spyOn(console, "error").mockImplementation(() => {});
  globalThis.fetch = async () => { throw new Error("Connection lost"); };
  expect(await checkRegistration()).toEqual({ registered: null, error: "Connection failed" });
});

test("every registration and lookup request receives a 15-second deadline", async () => {
  const signals = [];
  const timeout = spyOn(AbortSignal, "timeout").mockImplementation(ms => {
    expect(ms).toBe(15000);
    const signal = new AbortController().signal;
    signals.push(signal);
    return signal;
  });
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push(init.signal);
    return Response.json(String(url).includes("playerdb.co")
      ? { code: "player.found", data: { player: { id: "uuid", username: "Player" } } }
      : {});
  };
  await checkRegistration();
  expect((await registerUser("uuid")).success).toBe(true);
  expect((await unregisterUser()).success).toBe(true);
  expect((await verifyMinecraftAccount("Player")).success).toBe(true);
  expect(timeout).toHaveBeenCalledTimes(5);
  expect(requests).toEqual(signals);
});

async function mount(component) {
  dom = new JSDOM("<div id='root'></div>", { url: "https://example.test" });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document,
    sessionStorage: dom.window.sessionStorage, IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
  const media = { matches: false, addEventListener() {}, removeEventListener() {} };
  globalThis.matchMedia = () => media;
  globalThis.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; }
    observe() { this.callback([{ isIntersecting: true }]); }
    disconnect() {}
  };
  const container = document.getElementById("root");
  root = createRoot(container);
  await act(async () => { root.render(component); });
  return { container, media };
}

test("registration outage blocks the wizard and retry restores registered controls", async () => {
  globalThis.fetch = async () => new Response(null, { status: 503 });
  const { container } = await mount(createElement(SetupWizard, { session }));
  expect(container.querySelector("[role=alert]")).not.toBeNull();
  expect(container.textContent).not.toContain("Jetzt Registrieren");
  globalThis.fetch = async () => new Response(null, { status: 200 });
  await act(async () => { container.querySelector("button").click(); });
  expect(container.querySelector("[role=alert]")).toBeNull();
  expect(container.textContent).toContain("abmelden");
});

test("visible previews animate only on hover or focus, and respect reduced motion", async () => {
  const { container, media } = await mount(createElement(StaticPreview,
    { src: "/poster.png", animatedSrc: "/animated.webp", alt: "Cape" }));
  const host = container.querySelector("[role=group]");
  const source = () => container.querySelector("img").getAttribute("src");
  expect(source()).toBe("/poster.png");
  await act(() => { host.dispatchEvent(new window.Event("pointerover", { bubbles: true })); });
  expect(source()).toBe("/animated.webp");
  await act(() => { host.dispatchEvent(new window.Event("pointerout", { bubbles: true })); });
  expect(source()).toBe("/poster.png");
  await act(() => { host.focus(); });
  expect(source()).toBe("/animated.webp");
  await act(() => { container.querySelector("img").dispatchEvent(new window.Event("error")); });
  expect(source()).toBe("/poster.png");
  await act(() => { host.blur(); });
  await act(() => { host.focus(); });
  expect(source()).toBe("/animated.webp");
  media.matches = true;
  await act(() => { root.render(createElement(StaticPreview,
    { src: "/poster.png", animatedSrc: "/animated.webp", alt: "Cape" })); });
  expect(source()).toBe("/poster.png");
  media.matches = false;
  await act(() => { host.blur(); });
  expect(source()).toBe("/poster.png");
});
