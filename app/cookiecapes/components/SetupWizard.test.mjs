import { afterEach, expect, mock, test } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";

mock.module("../../actions/account-actions", () => ({ startMinecraftLink: async () => {}, uploadWebsiteCape: async () => {} }));
// Other tests import Radix before a document exists; use its browser hook for this DOM test.
mock.module("@radix-ui/react-use-layout-effect", () => ({ useLayoutEffect }));
const globalNames = ["window", "document", "IS_REACT_ACT_ENVIRONMENT", "HTMLElement", "HTMLInputElement", "HTMLButtonElement", "Element", "Node", "NodeFilter", "DocumentFragment", "MutationObserver", "CustomEvent", "getComputedStyle", "matchMedia", "IntersectionObserver", "requestAnimationFrame", "cancelAnimationFrame", "ImageDecoder", "createImageBitmap"];
const originalGlobals = Object.fromEntries(globalNames.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
let dom, root;

afterEach(async () => {
  if (root) await act(() => root.unmount());
  root = undefined;
  dom?.window.close();
  dom = undefined;
  for (const [key, descriptor] of Object.entries(originalGlobals)) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
});

test("repeated keyboard reorders keep focus and selection on the moved frame", async () => {
  dom = new JSDOM("<div id='root'></div>", { url: "https://example.test" });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  for (const key of ["HTMLElement", "HTMLInputElement", "HTMLButtonElement", "Element", "Node", "NodeFilter", "DocumentFragment", "MutationObserver", "CustomEvent", "getComputedStyle"]) globalThis[key] = dom.window[key];
  globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  globalThis.ImageDecoder = class {
    completed = Promise.resolve();
    tracks = { ready: Promise.resolve(), selectedTrack: { frameCount: 3 } };
    async decode({ frameIndex }) { return { image: { width: 64, height: 32, duration: (frameIndex + 1) * 100000, close() {} } }; }
    close() {}
  };
  globalThis.createImageBitmap = async image => ({ width: image.width, height: image.height, close() {} });
  dom.window.HTMLCanvasElement.prototype.getContext = () => ({ drawImage() {}, clearRect() {} });
  const { default: SetupWizard } = await import("./SetupWizard");
  const container = document.getElementById("root");
  root = createRoot(container);
  await act(async () => root.render(createElement(SetupWizard, {
    account: { links: [{ minecraft_uuid: "a".repeat(32), minecraft_name: "Player" }], user: { id: "1", name: "Player" }, mcid_enabled: true },
    replacementId: 1, initialName: "Cape",
  })));
  const input = container.querySelector("input[type=file]");
  const gif = new File([new Uint8Array([71, 73, 70, 56, 57, 97, 64, 0, 32, 0])], "cape.gif", { type: "image/gif" });
  Object.defineProperty(input, "files", { value: [gif] });
  await act(async () => input.dispatchEvent(new window.Event("change", { bubbles: true })));
  await act(async () => [...container.querySelectorAll("button")].find(button => button.textContent === "Advanced options").click());
  const buttons = () => [...document.querySelectorAll('[aria-label="Frame timeline"] button')];
  const durations = () => buttons().map(button => Number(button.textContent.match(/· (\d+) ms/)[1]));
  const move = async key => {
    await act(() => document.activeElement.dispatchEvent(new window.KeyboardEvent("keydown", { key, altKey: true, bubbles: true })));
    expect(document.activeElement === buttons().find(button => button.getAttribute("aria-pressed") === "true")).toBe(true);
    expect(document.activeElement.textContent).toContain("100 ms");
  };
  await act(() => buttons()[0].focus());
  await move("ArrowRight");
  expect(durations()).toEqual([200, 100, 300]);
  await move("ArrowRight");
  expect(durations()).toEqual([200, 300, 100]);
  await move("ArrowRight");
  expect(durations()).toEqual([200, 300, 100]);
  await move("ArrowLeft");
  await move("ArrowLeft");
  await move("ArrowLeft");
  expect(durations()).toEqual([100, 200, 300]);
});
