import { expect, test } from "bun:test";

test("offscreen viewers release graphics, ignore delayed textures, and recreate on return", () => {
  const result = Bun.spawnSync([process.execPath, "--eval", `
    import assert from "node:assert/strict";
    import { mock } from "bun:test";
    import { JSDOM } from "jsdom";
    import React, { act } from "react";
    import { createRoot } from "react-dom/client";
    const dom = new JSDOM('<div id="root"></div>', { url: "https://example.invalid" });
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    let visibility = "visible";
    Object.defineProperty(document, "visibilityState", { get: () => visibility });
    let intersection;
    globalThis.IntersectionObserver = class { constructor(callback) { intersection = callback; } observe() {} disconnect() {} };
    globalThis.ResizeObserver = class { observe() {} disconnect() {} };
    const decodes = [];
    globalThis.Image = class { decode() { return new Promise(resolve => decodes.push(resolve)); } };
    const viewers = [];
    class SkinViewer {
      disposed = false;
      skinLoads = 0;
      capeLoads = 0;
      closedTargets = 0;
      lostContexts = 0;
      camera = { position: { set() {} } };
      controls = {};
      playerObject = { rotation: {} };
      composer = { dispose: () => this.closedTargets++ };
      renderer = { forceContextLoss: () => this.lostContexts++ };
      constructor(options) { this.canvas = options.canvas; viewers.push(this); }
      dispose() { this.disposed = true; }
      loadSkin() { assert.equal(this.disposed, false); this.skinLoads++; }
      loadCape() { assert.equal(this.disposed, false); this.capeLoads++; }
      setSize() {}
    }
    mock.module("skinview3d", () => ({ SkinViewer, IdleAnimation: class {} }));
    mock.module("@/app/cookiecapes/i18n/client", () => ({ useTranslations: () => ({ t: text => text }) }));
    mock.module("@/components/ui/button", () => ({ Button: props => React.createElement("button", props) }));
    const { default: CapeViewer } = await import("./app/cookiecapes/components/CapeViewer.tsx");
    const root = createRoot(document.getElementById("root"));
    const flush = () => new Promise(resolve => setTimeout(resolve, 0));
    const visible = async value => act(async () => { intersection([{ isIntersecting: value }]); await flush(); });
    await act(async () => { root.render(React.createElement(CapeViewer, { capeUrl: "/cape.png" })); await flush(); });
    assert.equal(viewers.length, 0);
    await visible(true);
    await act(flush);
    assert.equal(viewers.length, 1);
    const firstCanvas = viewers[0].canvas;
    assert.equal(decodes.length, 2);
    await visible(false);
    assert.equal(viewers[0].disposed, true);
    assert.equal(viewers[0].closedTargets, 1);
    assert.equal(viewers[0].lostContexts, 1);
    assert.equal(document.querySelector("canvas"), null);
    await act(async () => { decodes.splice(0).forEach(resolve => resolve()); await flush(); });
    assert.equal(viewers[0].skinLoads, 0);
    assert.equal(viewers[0].capeLoads, 0);
    await visible(true);
    await act(flush);
    assert.equal(viewers.length, 2);
    assert.notEqual(viewers[1].canvas, firstCanvas);
    await act(async () => { decodes.splice(0).forEach(resolve => resolve()); await flush(); });
    assert.equal(viewers[1].skinLoads, 1);
    assert.equal(viewers[1].capeLoads, 1);
    assert.equal(viewers[1].renderPaused, false);
    await act(async () => { visibility = "hidden"; document.dispatchEvent(new window.Event("visibilitychange")); await flush(); });
    assert.equal(viewers[1].disposed, true);
    await act(async () => { visibility = "visible"; document.dispatchEvent(new window.Event("visibilitychange")); await flush(); });
    await act(flush);
    assert.equal(viewers.length, 3);
    await act(async () => root.unmount());
    assert.equal(viewers[2].disposed, true);
    dom.window.close();
    // React/jsdom can retain scheduler handles after the assertions finish.
    process.exit(0);
  `], { cwd: process.cwd(), stdout: "pipe", stderr: "pipe" });
  expect(new TextDecoder().decode(result.stderr)).toBe("");
  expect(result.exitCode, new TextDecoder().decode(result.stdout)).toBe(0);
}, 15000);
