import type { SkinViewer } from "skinview3d";
import { frameAt } from "./animation";

export function applyCapeCanvas(viewer: SkinViewer, source: HTMLCanvasElement) {
  if (!viewer.playerObject.cape.map || viewer.capeCanvas.width !== source.width || viewer.capeCanvas.height !== source.height) viewer.loadCape(source);
  const canvas = viewer.capeCanvas;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const map = viewer.playerObject.cape.map;
  if (map) map.needsUpdate = true;
}

interface Version {
  width: number; height: number; pages: string[];
  frames: { page: number; x: number; y: number }[];
  timeline: { frame: number; duration_ms: number }[];
}

export interface CapeManifestPlayer { setPlaying(value: boolean): void; dispose(): void }

export function playCapeManifest(viewer: SkinViewer, url: string, render: () => void): CapeManifestPlayer {
  const controller = new AbortController(), pages: ImageBitmap[] = [];
  let request = 0, elapsed = 0, started = 0;
  let playing = false, loaded = false;
  let tick: (now: number) => void = () => {};
  const canvas = document.createElement("canvas");
  const load = async () => {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("Animation unavailable");
    const manifest = await response.json();
    const version: Version = manifest.versions?.standard;
    if (manifest.version !== 1 || !version || !version.pages.length || version.pages.length > 8 || !version.frames.length || version.frames.length > 200 || !version.timeline.length || version.timeline.length > 200 || version.width < 2 || version.width > 256 || version.height * 2 !== version.width) throw new Error("Invalid animation manifest");
    let pixels = 0;
    for (const name of version.pages) {
      if (!/^standard-[0-9]+\.png$/.test(name)) throw new Error("Invalid animation page");
      const page = await fetch(new URL(name, new URL(url, location.href)), { signal: controller.signal });
      if (!page.ok) throw new Error("Animation unavailable");
      const blob = await page.blob();
      if (blob.size > 16 * 1024 * 1024) throw new Error("Page exceeds limit");
      const bitmap = await createImageBitmap(blob);
      pixels += bitmap.width * bitmap.height * 4;
      if (controller.signal.aborted || bitmap.width > 2048 || bitmap.height > 2048 || pixels > 32 * 1024 * 1024) { bitmap.close(); throw new Error("Page exceeds limit"); }
      pages.push(bitmap);
    }
    for (const item of version.timeline) if (!Number.isInteger(item.frame) || !version.frames[item.frame] || !Number.isFinite(item.duration_ms) || item.duration_ms < 1000 / 24 || item.duration_ms > 60000) throw new Error("Invalid animation timing");
    for (const frame of version.frames) if (!pages[frame.page] || frame.x < 0 || frame.y < 0 || frame.x + version.width > pages[frame.page].width || frame.y + version.height > pages[frame.page].height) throw new Error("Invalid frame rectangle");
    const durations = version.timeline.map(item => item.duration_ms);
    let previous = -1;
    canvas.width = version.width; canvas.height = version.height;
    tick = (now: number) => {
      if (controller.signal.aborted || viewer.disposed || !playing) return;
      const index = version.timeline[frameAt(durations, elapsed + now - started)].frame;
      if (index !== previous) {
        const frame = version.frames[index], context = canvas.getContext("2d")!;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(pages[frame.page], frame.x, frame.y, version.width, version.height, 0, 0, canvas.width, canvas.height);
        applyCapeCanvas(viewer, canvas); render(); previous = index;
      }
      request = requestAnimationFrame(tick);
    };
    loaded = true;
    if (!controller.signal.aborted && playing) request = requestAnimationFrame(tick);
  };
  void load().catch(() => pages.forEach(page => page.close()));
  return {
    setPlaying(value: boolean) {
      if (value === playing || controller.signal.aborted) return;
      const now = performance.now();
      if (playing) elapsed += now - started;
      playing = value; cancelAnimationFrame(request);
      if (playing) { started = now; if (loaded) request = requestAnimationFrame(tick); }
    },
    dispose() { controller.abort(); cancelAnimationFrame(request); pages.forEach(page => page.close()); canvas.width = canvas.height = 0; },
  };
}
