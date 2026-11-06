import "server-only";
import { animationVersion, type AnimationVersion, MAX_PAGE_SIZE, MAX_PAGE_BYTES } from "./animation-manifest";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { download, PreviewError } from "./preview-source";
import { renderPreview } from "./preview-renderer";

export function validatePreviewAnimation(manifest: unknown): AnimationVersion {
  const version = animationVersion(manifest, "standard");
  if (!version || ![64, 128, 256].includes(version.width)) throw new PreviewError(502);
  return version;
}

// Bound server work and retain only compressed previews; CDN/browser caches share the result.
const cache = new Map<string, { bytes: Buffer; expires: number }>();
let running = false;

export function previewTimeline(timeline: AnimationVersion["timeline"]): AnimationVersion["timeline"] {
  if (timeline.length <= 48) return timeline.map(item => ({ ...item, duration_ms: Math.round(item.duration_ms) }));
  const total = timeline.reduce((sum, item) => sum + item.duration_ms, 0);
  const count = Math.max(1, Math.min(48, Math.floor(total / (1000 / 6))));
  const sampled: AnimationVersion["timeline"] = [];
  let source = 0, end = timeline[0].duration_ms;
  for (let i = 0; i < count; i++) {
    const at = i * total / count;
    while (at >= end && source < timeline.length - 1) end += timeline[++source].duration_ms;
    const frame = timeline[source].frame;
    let duration = Math.round((i + 1) * total / count) - Math.round(at);
    while (duration > 0) {
      const previous = sampled.at(-1);
      const chunk = Math.min(duration, 60000 - (previous?.frame === frame ? previous.duration_ms : 0));
      if (chunk === 0) { sampled.push({ frame, duration_ms: Math.min(duration, 60000) }); duration -= Math.min(duration, 60000); }
      else { if (previous?.frame === frame) previous.duration_ms += chunk; else sampled.push({ frame, duration_ms: chunk }); duration -= chunk; }
    }
  }
  return sampled;
}

export async function renderAnimationPreview(base: string, signal: AbortSignal, skin?: Buffer, slim?: boolean): Promise<Buffer> {
  const key = `${base}:${skin ? createHash("sha256").update(skin).digest("hex") : ""}:${slim}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.bytes;
  if (running) throw new PreviewError(503);
  running = true;
  try {
    const version = validatePreviewAnimation(JSON.parse((await download(`${base}manifest.json`, signal, false, true)).toString("utf8")));
    const timeline = previewTimeline(version.timeline);
    const needed = new Set(timeline.map(t => t.frame));
    const rendered = new Map<number, Buffer>();
    const deadline = performance.now() + 10000;
    for (let page = 0; page < version.pages.length; page++) {
      if (!version.frames.some((frame, i) => frame.page === page && needed.has(i))) continue;
      signal.throwIfAborted();
      const bytes = await download(base + version.pages[page], signal, false, false, MAX_PAGE_BYTES);
      const image = sharp(bytes, { limitInputPixels: MAX_PAGE_SIZE * MAX_PAGE_SIZE }).timeout({ seconds: 2 });
      const metadata = await image.metadata();
      if (metadata.format !== "png" || (metadata.pages ?? 1) !== 1 || !metadata.width || !metadata.height || metadata.width > MAX_PAGE_SIZE || metadata.height > MAX_PAGE_SIZE) throw new PreviewError(502);
      for (let i = 0; i < version.frames.length; i++) {
        const frame = version.frames[i];
        if (frame.page !== page || !needed.has(i)) continue;
        signal.throwIfAborted();
        if (performance.now() > deadline) throw new PreviewError(504);
        const cape = await image.clone().extract({ left: frame.x, top: frame.y, width: version.width, height: version.height }).png().toBuffer();
        const png = await renderPreview({ skin, cape, slim });
        rendered.set(i, await sharp(png).resize(192, 256).png().toBuffer());
      }
    }
    signal.throwIfAborted();
    const result = await sharp(timeline.map(t => rendered.get(t.frame)!), { join: { animated: true } })
      .timeout({ seconds: 2 }).webp({ loop: 0, delay: timeline.map(t => t.duration_ms), quality: 80 }).toBuffer();
    if (result.length > 4 * 1024 * 1024) throw new PreviewError(502);
    cache.delete(key);
    cache.set(key, { bytes: result, expires: Date.now() + 3600000 });
    let total = [...cache.values()].reduce((sum, entry) => sum + entry.bytes.length, 0);
    for (const [id, entry] of cache) {
      if (cache.size <= 16 && total <= 24 * 1024 * 1024) break;
      cache.delete(id); total -= entry.bytes.length;
    }
    return result;
  } finally { running = false; }
}
