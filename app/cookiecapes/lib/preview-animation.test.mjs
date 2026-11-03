import { test, expect, mock } from "bun:test";
import sharp from "sharp";
mock.module("server-only", () => ({}));
const { renderAnimationPreview, validatePreviewAnimation, previewTimeline } = await import("./preview-animation.ts");
const { publicAnimation } = await import("./preview-source.ts");
const { API_BASE_URL } = await import("./api.ts");

const version = {
  width: 64, height: 32, pages: ["standard-0.png"],
  frames: [{ page: 0, x: 0, y: 0 }, { page: 0, x: 64, y: 0 }],
  timeline: [{ frame: 0, duration_ms: 100 }, { frame: 1, duration_ms: 200 }, { frame: 0, duration_ms: 300 }],
};
test("large previews bound work without slowing the animation cycle or truncating long holds", () => {
  const timeline = Array.from({ length: 200 }, (_, frame) => ({ frame, duration_ms: 1000 / 24 }));
  const sampled = previewTimeline(timeline);
  expect(new Set(sampled.map(t => t.frame)).size).toBeLessThanOrEqual(48);
  expect(sampled.reduce((sum, t) => sum + t.duration_ms, 0)).toBe(Math.round(200000 / 24));
  const long = previewTimeline(timeline.map(t => ({ ...t, duration_ms: 60000 })));
  expect(long.every(t => t.duration_ms <= 60000)).toBe(true);
  expect(long.reduce((sum, t) => sum + t.duration_ms, 0)).toBe(12000000);
});
test("animation renderer validates bounds, frame references, timing and page paths", () => {
  expect(validatePreviewAnimation({ version: 1, versions: { standard: version } })).toBe(version);
  for (const changes of [{ pages: ["../secret.png"] }, { width: 512 }, { timeline: [{ frame: 3, duration_ms: 100 }] }, { timeline: [{ frame: 0, duration_ms: 10 }] }, { frames: [{ page: 8, x: 0, y: 0 }] }]) {
    expect(() => validatePreviewAnimation({ version: 1, versions: { standard: { ...version, ...changes } } })).toThrow();
  }
});

test("server-rendered WebP preserves looping, duration and repeated timeline frames; cached render avoids work", async () => {
  const raw = Buffer.alloc(128 * 32 * 4);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 128; x++) raw.set(x < 64 ? [255,0,0,255] : [0,0,255,255], (y * 128 + x) * 4);
  const page = await sharp(raw, { raw: { width: 128, height: 32, channels: 4 } }).png().toBuffer();
  const original = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async url => {
    requests++;
    return String(url).endsWith("manifest.json")
      ? Response.json({ version: 1, versions: { standard: version } })
      : new Response(page, { headers: { "Content-Type": "image/png" } });
  };
  try {
    const base = `${API_BASE_URL}/capes/2/animation/${"a".repeat(32)}/`;
    const bytes = await renderAnimationPreview(base, new AbortController().signal);
    const metadata = await sharp(bytes, { animated: true }).metadata();
    expect(metadata.format).toBe("webp"); expect(metadata.pages).toBe(3);
    expect(metadata.width).toBe(192); expect(metadata.pageHeight).toBe(256);
    expect(metadata.delay).toEqual([100,200,300]); expect(metadata.loop).toBe(0);
    expect(await renderAnimationPreview(base, new AbortController().signal)).toBe(bytes);
    expect(requests).toBe(2);
  } finally { globalThis.fetch = original; }
});

test("animation metadata enforces public visibility and constructs trusted asset paths", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ is_private: true });
    await expect(publicAnimation(2, new AbortController().signal)).rejects.toThrow();
    globalThis.fetch = async () => Response.json({ animation: { version: 1, revision: "b".repeat(32), manifest_url: "https://untrusted.invalid/" } });
    expect(await publicAnimation(2, new AbortController().signal)).toBe(`${API_BASE_URL}/capes/2/animation/${"b".repeat(32)}/`);
  } finally { globalThis.fetch = original; }
});
