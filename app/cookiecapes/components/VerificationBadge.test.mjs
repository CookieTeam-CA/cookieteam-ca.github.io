import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import VerificationBadge from "./VerificationBadge.tsx";
test("missing and legacy verification never display a badge", () => {
  expect(renderToStaticMarkup(createElement(VerificationBadge, {}))).toBe("");
  expect(renderToStaticMarkup(createElement(VerificationBadge, { verification: "unverified" }))).toBe("");
});
test("website and session badges retain distinct accessible meanings", () => {
  const website = renderToStaticMarkup(createElement(VerificationBadge, { verification: "website" }));
  const minecraft = renderToStaticMarkup(createElement(VerificationBadge, { verification: "minecraft_session" }));
  expect(website).toContain("text-blue-400");
  expect(website).toContain("verknüpften Minecraft-Account");
  expect(minecraft).toContain("text-orange-400");
  expect(minecraft).toContain("authentifizierten Minecraft-Sitzung");
  expect(website).toContain("aria-label=");
  expect(minecraft).toContain("keine Bestätigung der Motiv-Urheberschaft");
});
