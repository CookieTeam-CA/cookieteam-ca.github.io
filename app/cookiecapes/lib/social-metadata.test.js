import { expect, test } from "bun:test";
import { socialMetadata } from "./social-metadata";
import { capePreviewUrl, playerPreviewUrl } from "./preview-url";

test("cape and player shares use their own images and clean canonical URLs", () => {
  for (const [path, image] of [
    ["/cookiecapes/capes/42", capePreviewUrl(42, "2026-11-06")],
    ["/cookiecapes/players/Steve", playerPreviewUrl("a".repeat(32))],
  ]) {
    const metadata = socialMetadata("Example", "Description", path, image);
    expect(metadata.alternates?.canonical).toBe(path);
    expect(metadata.openGraph).toMatchObject({ title: "Example", description: "Description", url: path, images: [{ url: image, alt: "Example" }] });
    expect(metadata.twitter).toMatchObject({ title: "Example", description: "Description", images: [{ url: image }] });
  }
});

test("private or missing resources do not inherit a public preview image", () => {
  const metadata = socialMetadata("Private cape", "Description", "/cookiecapes/capes/42");
  expect(metadata.openGraph?.images).toEqual([]);
  expect(metadata.twitter?.images).toEqual([]);
});
