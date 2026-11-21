/**
 * Turns arbitrary artwork into a Minecraft cape texture.
 *
 * The artwork fills the cape's outer face; the 1px edge strips repeat the face border and the inner
 * face gets a darkened average colour. CookieAPI's `fit: "face"` option implements the same layout,
 * so keep both in sync. Units are a 64 × 32 atlas scaled by `k` (skinview3d box UVs):
 *   outer face (1,1) 10×16 · left strip (0,1) 1×16 · right strip (11,1) 1×16
 *   top strip (1,0) 10×1 · bottom strip (11,0) 10×1 · inner face (12,1) 10×16
 */

export const FACE_WIDTH = 10;
export const FACE_HEIGHT = 16;
export const FACE_ASPECT = FACE_WIDTH / FACE_HEIGHT;
export const MAX_ZOOM = 8;
export const MIN_FRAME_MS = 1000 / 24;
export const MAX_FRAME_MS = 60000;
export const MAX_OUTPUT_FRAMES = 200;

export interface Rect { x: number; y: number; width: number; height: number }
/** `x`/`y` are the crop centre relative to the source size (0–1). */
export interface Framing { fit: "fill" | "fit"; zoom: number; x: number; y: number }
export interface Pixels { data: Uint8ClampedArray; width: number; height: number }

export const DEFAULT_FRAMING: Framing = { fit: "fill", zoom: 1, x: 0.5, y: 0.5 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Keeps a crop inside the image when it fits, otherwise keeps the whole image inside the crop. */
function clampCentre(centre: number, size: number, total: number) {
  return size <= total ? clamp(centre, size / 2, total - size / 2) : clamp(centre, total - size / 2, size / 2);
}

/** The 5:8 source rectangle shown on the outer face. It may extend beyond the image in "fit" mode. */
export function cropRect(width: number, height: number, framing: Framing): Rect {
  const base = framing.fit === "fill" ? Math.min(width, height * FACE_ASPECT) : Math.max(width, height * FACE_ASPECT);
  const cropWidth = base / clamp(framing.zoom, 1, MAX_ZOOM), cropHeight = cropWidth / FACE_ASPECT;
  const x = clampCentre(framing.x * width, cropWidth, width), y = clampCentre(framing.y * height, cropHeight, height);
  return { x: x - cropWidth / 2, y: y - cropHeight / 2, width: cropWidth, height: cropHeight };
}

/** Normalises a framing so its centre is the clamped one (dragging past an edge does not accumulate). */
function settle(width: number, height: number, framing: Framing): Framing {
  const rect = cropRect(width, height, framing);
  return { ...framing, zoom: clamp(framing.zoom, 1, MAX_ZOOM), x: (rect.x + rect.width / 2) / width, y: (rect.y + rect.height / 2) / height };
}

/** Moves the crop by a distance in source pixels. */
export function panFraming(width: number, height: number, framing: Framing, dx: number, dy: number): Framing {
  const current = settle(width, height, framing);
  return settle(width, height, { ...current, x: current.x + dx / width, y: current.y + dy / height });
}

export function zoomFraming(width: number, height: number, framing: Framing, zoom: number): Framing {
  return settle(width, height, { ...settle(width, height, framing), zoom });
}

/** Files that already use a cape layout are uploaded as they are. */
export function classifySource(width: number, height: number): "texture" | "artwork" {
  if (width === height * 2 && width >= 64 && width % 64 === 0) return "texture";
  if (width * 17 === height * 22 || width * 11 === height * 23) return "texture";
  return "artwork";
}

/** Small sources are pixel art and scale with nearest neighbour; photos are smoothed. */
export const isPixelArt = (width: number, height: number) => Math.max(width, height) <= 128;

/** Alpha-weighted average colour of the face, darkened to 60 %. */
export function innerColour(face: Pixels): [number, number, number, number] {
  let r = 0, g = 0, b = 0, a = 0;
  for (let i = 0; i < face.data.length; i += 4) {
    const alpha = face.data[i + 3];
    r += face.data[i] * alpha; g += face.data[i + 1] * alpha; b += face.data[i + 2] * alpha; a += alpha;
  }
  if (!a) return [0, 0, 0, 0];
  return [Math.round(r / a * 0.6), Math.round(g / a * 0.6), Math.round(b / a * 0.6), 255];
}

/** Share of face pixels that are visibly opaque. */
export function opaqueCoverage(face: Pixels): number {
  let visible = 0;
  for (let i = 3; i < face.data.length; i += 4) if (face.data[i] >= 16) visible++;
  return face.data.length ? visible / (face.data.length / 4) : 0;
}

/** Builds the 64k × 32k atlas from a 10k × 16k face. */
export function atlasFromFace(face: Pixels, k: number): Pixels {
  if (!Number.isInteger(k) || k < 1 || face.width !== FACE_WIDTH * k || face.height !== FACE_HEIGHT * k) throw new Error("Face size does not match the scale.");
  const width = 64 * k, height = 32 * k, data = new Uint8ClampedArray(width * height * 4);
  const copy = (x: number, y: number, fx: number, fy: number) => {
    const to = (y * width + x) * 4, from = (fy * face.width + fx) * 4;
    data[to] = face.data[from]; data[to + 1] = face.data[from + 1]; data[to + 2] = face.data[from + 2]; data[to + 3] = face.data[from + 3];
  };
  const faceWidth = FACE_WIDTH * k, faceHeight = FACE_HEIGHT * k;
  for (let fy = 0; fy < faceHeight; fy++) for (let fx = 0; fx < faceWidth; fx++) copy(k + fx, k + fy, fx, fy);
  for (let fy = 0; fy < faceHeight; fy++) for (let s = 0; s < k; s++) {
    copy(s, k + fy, 0, fy);
    copy(11 * k + s, k + fy, faceWidth - 1, fy);
  }
  for (let fx = 0; fx < faceWidth; fx++) for (let s = 0; s < k; s++) {
    copy(k + fx, s, fx, 0);
    copy(11 * k + fx, s, fx, faceHeight - 1);
  }
  const colour = innerColour(face);
  for (let y = k; y < 17 * k; y++) for (let x = 12 * k; x < 22 * k; x++) data.set(colour, (y * width + x) * 4);
  return { data, width, height };
}

/**
 * Rebuilds a timeline with frames no shorter than 1/24 s and at most 200 entries, preserving the total
 * playback time. Returns source indices with their new durations.
 */
export function resampleTimeline(durations: number[], minimum = MIN_FRAME_MS, maxFrames = MAX_OUTPUT_FRAMES): { index: number; duration: number }[] {
  if (!durations.length) return [];
  if (durations.length <= maxFrames && durations.every(duration => duration >= minimum)) return durations.map((duration, index) => ({ index, duration }));
  const total = durations.reduce((sum, duration) => sum + duration, 0);
  const count = Math.min(maxFrames, Math.max(1, Math.floor(total / minimum + 1e-6)));
  const step = Math.max(minimum, total / count);
  const result: { index: number; duration: number }[] = [];
  let index = 0, end = durations[0];
  for (let sample = 0; sample < count; sample++) {
    while (index < durations.length - 1 && sample * step >= end) end += durations[++index];
    const last = result.at(-1);
    if (last?.index === index && last.duration + step <= MAX_FRAME_MS) last.duration += step;
    else result.push({ index, duration: step });
  }
  return result;
}

/** Draws the framed source onto a face canvas of 10k × 16k and returns its pixels. */
export function renderFace(canvas: HTMLCanvasElement, source: CanvasImageSource, width: number, height: number, framing: Framing, k: number, options: { pixelArt: boolean; background?: string | null }): Pixels {
  canvas.width = FACE_WIDTH * k; canvas.height = FACE_HEIGHT * k;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (options.background) { context.fillStyle = options.background; context.fillRect(0, 0, canvas.width, canvas.height); }
  context.imageSmoothingEnabled = !options.pixelArt;
  context.imageSmoothingQuality = "high";
  const rect = cropRect(width, height, framing);
  // Draw only the overlapping part so browsers never have to clip the source rectangle.
  const sx = Math.max(0, rect.x), sy = Math.max(0, rect.y);
  const ex = Math.min(width, rect.x + rect.width), ey = Math.min(height, rect.y + rect.height);
  if (ex > sx && ey > sy) {
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    context.drawImage(source, sx, sy, ex - sx, ey - sy, (sx - rect.x) * scaleX, (sy - rect.y) * scaleY, (ex - sx) * scaleX, (ey - sy) * scaleY);
  }
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  return { data: image.data, width: image.width, height: image.height };
}

/** Composes a complete cape texture into `target` and returns the outer face's opaque coverage. */
export function composeCape(target: HTMLCanvasElement, scratch: HTMLCanvasElement, source: CanvasImageSource, width: number, height: number, framing: Framing, k: number, options: { pixelArt: boolean; background?: string | null }): number {
  const face = renderFace(scratch, source, width, height, framing, k, options);
  const atlas = atlasFromFace(face, k);
  target.width = atlas.width; target.height = atlas.height;
  target.getContext("2d")!.putImageData(new ImageData(atlas.data as Uint8ClampedArray<ArrayBuffer>, atlas.width, atlas.height), 0, 0);
  return opaqueCoverage(face);
}
