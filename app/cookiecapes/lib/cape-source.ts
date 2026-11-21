import { translations } from "../i18n/messages";
import { MAX_FRAMES, MAX_UPLOAD_BYTES } from "./animation-manifest";
import { MAX_SOURCE_BYTES, type ComposerFrame } from "./animation";
import { classifySource, resampleTimeline } from "./cape-compose";
import { sniffImage } from "./cape-upload";

/** Working frames stay small: the outer face is at most 80 × 128 pixels, and CookieAPI accepts 512 × 300. */
const WORKING_SIDE = 512;
const STATIC_SIDE = 4096;
const DEFAULT_DURATION = 1000 / 12;

export interface CapeSource {
  /** Normalised original files, used for uploads the browser cannot compose. */
  files: File[];
  name: string;
  animated: boolean;
  /** Whether `frames` hold the whole animation (false: only a poster frame). */
  decoded: boolean;
  frames: ComposerFrame[];
  width: number; height: number;
  sourceWidth: number; sourceHeight: number;
  kind: "texture" | "artwork";
  /** Frames were merged to reach 24 FPS or 200 frames. */
  resampled: boolean;
}

interface DecodedFrame { image: VideoFrame }
interface BrowserImageDecoder {
  completed: Promise<void>;
  tracks: { ready: Promise<void>; selectedTrack: { frameCount: number } | null };
  decode(options: { frameIndex: number }): Promise<DecodedFrame>;
  close(): void;
}
type DecoderConstructor = new (options: { data: ArrayBuffer; type: string; preferAnimation: boolean }) => BrowserImageDecoder;

export const canDecodeAnimations = () => "ImageDecoder" in globalThis;

function workingScale(width: number, height: number, count: number) {
  return Math.min(1, WORKING_SIDE / Math.max(width, height), Math.sqrt(MAX_SOURCE_BYTES / (count * width * height * 4)));
}

async function bitmap(source: ImageBitmapSource, width: number, height: number, scale: number) {
  return scale >= 1 ? createImageBitmap(source) : createImageBitmap(source, {
    resizeWidth: Math.max(1, Math.round(width * scale)), resizeHeight: Math.max(1, Math.round(height * scale)), resizeQuality: "high",
  });
}

function finish(images: ImageBitmap[], durations: number[]): { frames: ComposerFrame[]; resampled: boolean } {
  const timeline = resampleTimeline(durations);
  const used = new Set(timeline.map(item => item.index));
  images.forEach((image, index) => { if (!used.has(index)) image.close(); });
  return { frames: timeline.map(item => ({ image: images[item.index], duration: item.duration })), resampled: timeline.length !== durations.length || timeline.some((item, i) => item.duration !== durations[i]) };
}

async function decodeAnimation(file: File, t: ReturnType<typeof translations>["t"]) {
  const Decoder = (globalThis as unknown as { ImageDecoder?: DecoderConstructor }).ImageDecoder;
  if (!Decoder) return undefined;
  const decoder = new Decoder({ data: await file.arrayBuffer(), type: file.type === "image/apng" ? "image/png" : file.type || "image/png", preferAnimation: true });
  const images: ImageBitmap[] = [], durations: number[] = [];
  try {
    // Track readiness can precede the final animation frame count.
    await Promise.all([decoder.tracks.ready, decoder.completed]);
    const count = decoder.tracks.selectedTrack?.frameCount ?? 0;
    if (!count) throw new Error(t("No animation frames were found."));
    if (count > 2000) throw new Error(t("This animation has too many frames."));
    let scale = 1, width = 0, height = 0;
    for (let i = 0; i < count; i++) {
      const { image } = await decoder.decode({ frameIndex: i });
      try {
        if (!i) { width = image.displayWidth; height = image.displayHeight; scale = workingScale(width, height, count); }
        images.push(await bitmap(image, width, height, scale));
        const duration = image.duration ? image.duration / 1000 : null;
        // Browsers play GIF delays of 10 ms or less at 100 ms; CookieAPI does the same.
        durations.push(duration === null ? DEFAULT_DURATION : file.type === "image/gif" && duration <= 10 ? 100 : Math.min(60000, duration));
      } finally { image.close(); }
    }
    return { images, durations, width, height };
  } catch (error) { images.forEach(image => image.close()); throw error; }
  finally { decoder.close(); }
}

/** Opens what the user brought: one image, one animated image, or several PNG frames. */
export async function loadCapeSource(input: File[], t = translations("en").t): Promise<CapeSource> {
  if (!input.length || input.length > MAX_FRAMES || input.some(file => !file.size) || input.reduce((sum, file) => sum + file.size, 0) > MAX_UPLOAD_BYTES) throw new Error(t("Please choose up to 200 frames totaling no more than 32 MiB."));
  const sniffed = await Promise.all(input.map(file => sniffImage(file, t)));
  const files = sniffed.map(item => item.file);
  const name = files[0].name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 100);
  const base = { files, name };

  if (files.length > 1) {
    if (files.some(file => file.type !== "image/png") || sniffed.some(item => item.animated)) throw new Error(t("Please use PNG for ordered frames."));
    const first = await createImageBitmap(files[0]);
    const { width, height } = first; first.close();
    const scale = workingScale(width, height, files.length);
    const images: ImageBitmap[] = [];
    try {
      for (const file of files) {
        const full = await createImageBitmap(file);
        try {
          if (full.width !== width || full.height !== height) throw new Error(t("All frames must have the same dimensions."));
          images.push(await bitmap(full, width, height, scale));
        } finally { full.close(); }
      }
    } catch (error) { images.forEach(image => image.close()); throw error; }
    const { frames, resampled } = finish(images, images.map(() => DEFAULT_DURATION));
    return { ...base, animated: true, decoded: true, frames, resampled, width: frames[0].image.width, height: frames[0].image.height, sourceWidth: width, sourceHeight: height, kind: classifySource(width, height) };
  }

  const file = files[0];
  if (sniffed[0].animated) {
    let decoded: Awaited<ReturnType<typeof decodeAnimation>>;
    try { decoded = await decodeAnimation(file, t); }
    catch (error) { if (error instanceof Error && error.message === t("This animation has too many frames.")) throw error; decoded = undefined; }
    if (decoded && decoded.images.length > 1) {
      const { frames, resampled } = finish(decoded.images, decoded.durations);
      return { ...base, animated: true, decoded: true, frames, resampled, width: frames[0].image.width, height: frames[0].image.height, sourceWidth: decoded.width, sourceHeight: decoded.height, kind: classifySource(decoded.width, decoded.height) };
    }
    decoded?.images.forEach(image => image.close());
    // Without ImageDecoder the browser still shows the first frame; CookieAPI composes the animation.
    const poster = await createImageBitmap(file);
    if (!decoded) return { ...base, animated: true, decoded: false, frames: [{ image: poster, duration: DEFAULT_DURATION }], resampled: false, width: poster.width, height: poster.height, sourceWidth: poster.width, sourceHeight: poster.height, kind: classifySource(poster.width, poster.height) };
    poster.close();
  }

  const full = await createImageBitmap(file);
  const { width, height } = full;
  if (!width || !height) { full.close(); throw new Error(t("This image format could not be opened.")); }
  const scale = Math.min(1, STATIC_SIDE / Math.max(width, height));
  const image = scale < 1 ? await bitmap(full, width, height, scale) : full;
  if (image !== full) full.close();
  return { ...base, animated: false, decoded: true, frames: [{ image, duration: DEFAULT_DURATION }], resampled: false, width: image.width, height: image.height, sourceWidth: width, sourceHeight: height, kind: classifySource(width, height) };
}
