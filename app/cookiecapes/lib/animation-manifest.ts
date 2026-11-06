export const MAX_FRAMES = 200;
export const MAX_UPLOAD_BYTES = 32 * 1024 * 1024;
export const MAX_PAGE_BYTES = 16 * 1024 * 1024;
export const MAX_PAGE_SIZE = 2048;
export const MIN_FRAME_DURATION = 1000 / 24;
export const MAX_FRAME_DURATION = 60000;

export interface AnimationVersion {
  width: number; height: number; pages: string[];
  frames: { page: number; x: number; y: number }[];
  timeline: { frame: number; duration_ms: number }[];
}

export function animationVersion(manifest: unknown, quality: "standard" | "hd"): AnimationVersion | undefined {
  if (!manifest || typeof manifest !== "object" || !("version" in manifest) || manifest.version !== 1 || !("versions" in manifest)) return;
  const versions = manifest.versions;
  if (!versions || typeof versions !== "object") return;
  const version = (versions as Record<string, AnimationVersion | undefined>)[quality];
  if (!version || !Number.isInteger(version.width) || version.width < 2 || version.width > (quality === "hd" ? 512 : 256)
    || !Number.isInteger(version.height) || version.height * 2 !== version.width
    || !Array.isArray(version.pages) || !version.pages.length || version.pages.length > 8
    || version.pages.some(page => typeof page !== "string" || !new RegExp(`^${quality}-[0-9]+\\.png$`).test(page))
    || !Array.isArray(version.frames) || !version.frames.length || version.frames.length > MAX_FRAMES
    || !Array.isArray(version.timeline) || !version.timeline.length || version.timeline.length > MAX_FRAMES) return;
  for (const frame of version.frames) {
    if (!frame || !Number.isInteger(frame.page) || !version.pages[frame.page] || !Number.isInteger(frame.x) || !Number.isInteger(frame.y)
      || frame.x < 0 || frame.y < 0 || frame.x + version.width > MAX_PAGE_SIZE || frame.y + version.height > MAX_PAGE_SIZE) return;
  }
  for (const item of version.timeline) {
    if (!item || !Number.isInteger(item.frame) || !version.frames[item.frame] || !Number.isFinite(item.duration_ms)
      || item.duration_ms < MIN_FRAME_DURATION || item.duration_ms > MAX_FRAME_DURATION) return;
  }
  return version;
}

export function frameAt(durations: number[], elapsed: number): number {
  const total = durations.reduce((sum, duration) => sum + duration, 0);
  if (!durations.length || total <= 0) return 0;
  let time = ((elapsed % total) + total) % total;
  for (let i = 0; i < durations.length; i++) { if (time < durations[i]) return i; time -= durations[i]; }
  return 0;
}
