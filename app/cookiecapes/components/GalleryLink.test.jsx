import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";

let linkProps;
const push = mock(() => {});
mock.module("next/link", () => ({ default: props => {
  linkProps = props;
  return <a href={props.href}>{props.children}</a>;
} }));
mock.module("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/cookiecapes/capes/42" }));
const { default: GalleryLink, GalleryReturnLink } = await import("./GalleryLink");

test("normal navigation stores the gallery filters and opens a clean URL", () => {
  const storage = new Map();
  const original = globalThis.sessionStorage;
  globalThis.sessionStorage = { setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) };
  try {
    const destination = "/cookiecapes/capes/42";
    const returnTo = "/cookiecapes/capes?sort=active_user_count&order=desc&page=3";
    renderToStaticMarkup(<GalleryLink href={destination} returnTo={returnTo}>Cape</GalleryLink>);
    // Native new-tab/copy actions retain the progressive fallback.
    expect(linkProps.href).toBe(`${destination}?returnTo=${encodeURIComponent(returnTo)}`);
    const preventDefault = mock(() => {});
    linkProps.onNavigate({ preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenLastCalledWith(destination);
    expect([...storage.values()]).toEqual([returnTo]);
    renderToStaticMarkup(<GalleryLink href={destination}>Cape</GalleryLink>);
    linkProps.onNavigate({ preventDefault });
    expect(storage.size).toBe(0);
  } finally { globalThis.sessionStorage = original; }
});

test("blocked storage leaves normal URL navigation intact", () => {
  const original = globalThis.sessionStorage;
  globalThis.sessionStorage = { setItem: () => { throw new Error("Blocked"); } };
  try {
    renderToStaticMarkup(<GalleryLink href="/cookiecapes/capes/42" returnTo="/cookiecapes/players?page=2">Cape</GalleryLink>);
    const preventDefault = mock(() => {});
    linkProps.onNavigate({ preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
    expect(linkProps.href).toContain("?returnTo=");
  } finally { globalThis.sessionStorage = original; }
});

test("legacy returns are validated and shared links have a gallery fallback", () => {
  renderToStaticMarkup(<GalleryReturnLink href="/cookiecapes/capes" returnTo="/cookiecapes/players?page=4">Back</GalleryReturnLink>);
  expect(linkProps.href).toBe("/cookiecapes/players?page=4");
  renderToStaticMarkup(<GalleryReturnLink href="/cookiecapes/capes" returnTo="https://evil.example">Back</GalleryReturnLink>);
  expect(linkProps.href).toBe("/cookiecapes/capes");
  renderToStaticMarkup(<GalleryReturnLink href="/cookiecapes/capes">Back</GalleryReturnLink>);
  expect(linkProps.href).toBe("/cookiecapes/capes");
});

test("the hydrated back link restores the saved destination, with legacy URLs taking precedence", async () => {
  const dom = new JSDOM("<div id='root'></div>", { url: "https://cookieattack.de" });
  const original = { window: globalThis.window, document: globalThis.document, sessionStorage: globalThis.sessionStorage, IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, sessionStorage: dom.window.sessionStorage, IS_REACT_ACT_ENVIRONMENT: true });
  const root = createRoot(document.getElementById("root"));
  try {
    sessionStorage.setItem("cookiecapes:return:/cookiecapes/capes/42", "/cookiecapes/capes?q=blue&page=3");
    await act(async () => root.render(<GalleryReturnLink href="/cookiecapes/capes">Back</GalleryReturnLink>));
    expect(document.querySelector("a").getAttribute("href")).toBe("/cookiecapes/capes?q=blue&page=3");
    await act(async () => root.render(<GalleryReturnLink href="/cookiecapes/capes" returnTo="/cookiecapes/players?page=2">Back</GalleryReturnLink>));
    expect(document.querySelector("a").getAttribute("href")).toBe("/cookiecapes/players?page=2");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    Object.assign(globalThis, original);
  }
});
