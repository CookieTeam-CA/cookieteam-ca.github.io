import type { SkinViewer } from "skinview3d";
import { animationVersion, frameAt, MAX_PAGE_BYTES, MAX_PAGE_SIZE } from "./animation-manifest";

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

export interface CapeManifestPlayer { setPlaying(value: boolean): void; dispose(): void }

export function playCapeManifest(viewer: SkinViewer, url: string, render: () => void, onLoad: () => void = () => {}): CapeManifestPlayer {
  const controller = new AbortController(), pages: ImageBitmap[] = [];
  let request = 0, elapsed = 0, started = 0;
  let playing = false, loaded = false;
  let tick: (now: number) => void = () => {};
  const canvas = document.createElement("canvas");
  const load = async () => {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("Animation unavailable");
    const manifest = await response.json();
    const version = animationVersion(manifest, "standard");
    if (!version) throw new Error("Invalid animation manifest");
    let pixels = 0;
    for (const name of version.pages) {
      const page = await fetch(new URL(name, new URL(url, location.href)), { signal: controller.signal });
      if (!page.ok) throw new Error("Animation unavailable");
      const blob = await page.blob();
      if (blob.size > MAX_PAGE_BYTES) throw new Error("Page exceeds limit");
      const bitmap = await createImageBitmap(blob);
      pixels += bitmap.width * bitmap.height * 4;
      if (controller.signal.aborted || bitmap.width > MAX_PAGE_SIZE || bitmap.height > MAX_PAGE_SIZE || pixels > 32 * 1024 * 1024) { bitmap.close(); throw new Error("Page exceeds limit"); }
      pages.push(bitmap);
    }
    for (const frame of version.frames) if (frame.x + version.width > pages[frame.page].width || frame.y + version.height > pages[frame.page].height) throw new Error("Invalid frame rectangle");
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
    if (controller.signal.aborted) return;
    onLoad();
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
