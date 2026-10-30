export interface ComposerFrame { image: ImageBitmap; duration: number }
export const MAX_FRAMES = 200;
export const MAX_SOURCE_BYTES = 120 * 1024 * 1024;

export function frameAt(durations: number[], elapsed: number): number {
  const total = durations.reduce((sum, duration) => sum + duration, 0);
  if (!durations.length || total <= 0) return 0;
  let time = ((elapsed % total) + total) % total;
  for (let i = 0; i < durations.length; i++) { if (time < durations[i]) return i; time -= durations[i]; }
  return 0;
}

export function templateWidth(frames: ComposerFrame[], fit: "pad" | "crop", maximum: number) {
  const largest = Math.max(2, ...frames.map(({ image }) => fit === "pad" ? Math.max(Math.ceil(image.width / 2) * 2, image.height * 2) : Math.floor(Math.min(image.width, image.height * 2) / 2) * 2));
  return Math.min(maximum, Math.max(64, 2 ** Math.ceil(Math.log2(largest))));
}

export function drawTemplate(canvas: HTMLCanvasElement, image: CanvasImageSource, width: number, height: number, fit: "pad" | "crop", maximum: number, commonWidth?: number) {
  const projected = fit === "pad" ? Math.max(Math.ceil(width / 2) * 2, height * 2) : Math.floor(Math.min(width, height * 2) / 2) * 2;
  const outputWidth = commonWidth ?? Math.min(maximum, Math.max(64, 2 ** Math.ceil(Math.log2(projected))));
  canvas.width = outputWidth; canvas.height = outputWidth / 2;
  const context = canvas.getContext("2d")!;
  context.imageSmoothingEnabled = false;
  const contentWidth = Math.max(2, Math.floor(Math.min(outputWidth, projected) / 2) * 2);
  const scale = contentWidth / projected;
  if (fit === "pad") {
    context.drawImage(image, Math.floor((canvas.width - width * scale) / 2), Math.floor((canvas.height - height * scale) / 2), width * scale, height * scale);
  } else {
    context.drawImage(image, (width - projected) / 2, (height - projected / 2) / 2, projected, projected / 2,
      Math.floor((canvas.width - contentWidth) / 2), Math.floor((canvas.height - contentWidth / 2) / 2), contentWidth, contentWidth / 2);
  }
}

interface DecodedFrame { image: VideoFrame; complete: boolean }
interface BrowserImageDecoder {
  tracks: { ready: Promise<void>; selectedTrack: { frameCount: number } };
  decode(options: { frameIndex: number }): Promise<DecodedFrame>;
  close(): void;
}
type DecoderConstructor = new (options: { data: ArrayBuffer; type: string }) => BrowserImageDecoder;

export async function inspectImage(file: Blob): Promise<{ width: number; height: number }> {
  const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  const view = new DataView(bytes.buffer);
  const text = (start: number, end: number) => new TextDecoder().decode(bytes.subarray(start, end));
  if (bytes.length >= 24 && text(1, 4) === "PNG" && text(12, 16) === "IHDR") return { width: view.getUint32(16), height: view.getUint32(20) };
  if (bytes.length >= 10 && /^GIF8[79]a$/.test(text(0, 6))) return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
  if (bytes.length >= 30 && text(0, 4) === "RIFF" && text(8, 12) === "WEBP") {
    if (text(12, 16) === "VP8X") return { width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16), height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16) };
    if (text(12, 16) === "VP8L" && bytes[20] === 0x2f) { const bits = view.getUint32(21, true); return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }; }
    if (text(12, 16) === "VP8 " && bytes[23] === 0x9d && bytes[24] === 1 && bytes[25] === 0x2a) return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
  }
  throw new Error("Das Bildformat oder sein Header wird nicht unterstützt.");
}

export async function importFrames(files: File[], mode: "image" | "frames" | "sheet", width: number, height: number): Promise<ComposerFrame[]> {
  if (!files.length || files.length > MAX_FRAMES || files.reduce((sum, file) => sum + file.size, 0) > 32 * 1024 * 1024) throw new Error("Maximal 200 Frames und 32 MiB.");
  if (mode !== "frames" && files.length !== 1) throw new Error("Bitte eine Animation oder ein Sprite-Sheet auswählen.");
  const result: ComposerFrame[] = [];
  let pixels = 0;
  const append = (image: ImageBitmap, duration = 1000 / 12) => {
    pixels += image.width * image.height * 4;
    if (result.length >= MAX_FRAMES || pixels > MAX_SOURCE_BYTES || image.width > 512 || image.height > 300 || image.width < 2) {
      image.close(); throw new Error("Maximal 200 Frames, 512 × 300 je Frame und 120 MiB Quellpixel.");
    }
    if (!Number.isFinite(duration) || duration < 1000 / 24 || duration > 60000) { image.close(); throw new Error("Die Quelldauer muss zwischen 1/24 Sekunde und 60 Sekunden pro Frame liegen."); }
    result.push({ image, duration });
  };
  try {
    for (const file of files) {
      const size = await inspectImage(file);
      const maxWidth = mode === "sheet" ? 2048 : 512, maxHeight = mode === "sheet" ? 2048 : 300;
      if (size.width < 2 || size.height < 1 || size.width > maxWidth || size.height > maxHeight) throw new Error("Die Bildabmessungen überschreiten das Importlimit.");
      if (mode === "sheet") {
        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || width > 512 || height < 1 || height > 300) throw new Error("Ungültige Frame-Größe.");
        const sheet = await createImageBitmap(file);
        try {
          if (sheet.width > 2048 || sheet.height > 2048 || sheet.width % width || sheet.height % height || sheet.width / width * (sheet.height / height) > 200) throw new Error("Sprite-Sheet: höchstens 2048 × 2048, ohne Rest teilbar, maximal 200 Frames.");
          for (let y = 0; y < sheet.height; y += height) for (let x = 0; x < sheet.width; x += width) append(await createImageBitmap(sheet, x, y, width, height));
        } finally { sheet.close(); }
      } else if (mode === "frames") {
        if (file.type !== "image/png") throw new Error("Für geordnete Frames bitte PNG verwenden.");
        append(await createImageBitmap(file));
      } else {
        const Decoder = (globalThis as unknown as { ImageDecoder?: DecoderConstructor }).ImageDecoder;
        if (!Decoder) throw new Error("Animierter Import benötigt einen Browser mit ImageDecoder (z. B. Chrome). PNG-Frames und Sprite-Sheets funktionieren auch ohne.");
        const decoder = new Decoder({ data: await file.arrayBuffer(), type: file.type === "image/apng" ? "image/png" : file.type || "image/png" });
        try {
          await decoder.tracks.ready;
          const count = decoder.tracks.selectedTrack.frameCount;
          if (count > MAX_FRAMES) throw new Error("Maximal 200 Frames.");
          for (let i = 0; i < count; i++) {
            const { image } = await decoder.decode({ frameIndex: i });
            try { append(await createImageBitmap(image), image.duration ? image.duration / 1000 : 1000 / 12); }
            finally { image.close(); }
          }
        } finally { decoder.close(); }
      }
    }
    return result;
  } catch (error) { for (const frame of result) frame.image.close(); throw error; }
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(12 + data.length), view = new DataView(bytes.buffer);
  view.setUint32(0, data.length); bytes.set(new TextEncoder().encode(type), 4); bytes.set(data, 8);
  view.setUint32(bytes.length - 4, crc32(bytes.subarray(4, bytes.length - 4))); return bytes;
}
const u32 = (...values: number[]) => { const bytes = new Uint8Array(values.length * 4); const view = new DataView(bytes.buffer); values.forEach((value, i) => view.setUint32(i * 4, value)); return bytes; };
export async function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("PNG-Export fehlgeschlagen.")), "image/png"));
}

/** Reuse browser PNG compression; full RGBA frames use SOURCE/NONE disposal. */
export async function exportApng(frames: ComposerFrame[], fit: "pad" | "crop", maximum: number): Promise<Blob> {
  if (!frames.length || frames.length > 200) throw new Error("Bitte 1–200 Frames auswählen.");
  const output: Uint8Array[] = [new Uint8Array([137,80,78,71,13,10,26,10])];
  const canvas = document.createElement("canvas");
  let sequence = 0, expectedWidth = 0, expectedHeight = 0;
  const commonWidth = templateWidth(frames, fit, maximum);
  for (let i = 0; i < frames.length; i++) {
    const { image, duration } = frames[i];
    drawTemplate(canvas, image, image.width, image.height, fit, maximum, commonWidth);
    if (i && (canvas.width !== expectedWidth || canvas.height !== expectedHeight)) throw new Error("Alle Frames benötigen dieselbe Größe.");
    expectedWidth = canvas.width; expectedHeight = canvas.height;
    const png = new Uint8Array(await (await canvasPng(canvas)).arrayBuffer());
    if (!i) { output.push(png.slice(8, 33)); output.push(chunk("acTL", u32(frames.length, 0))); }
    const control = new Uint8Array(26), view = new DataView(control.buffer);
    view.setUint32(0, sequence++); view.setUint32(4, canvas.width); view.setUint32(8, canvas.height);
    const denominator = Math.min(24000, Math.floor(65535 * 1000 / duration));
    view.setUint16(20, Math.round(duration * denominator / 1000)); view.setUint16(22, denominator);
    output.push(chunk("fcTL", control));
    for (let offset = 8; offset < png.length;) {
      const length = new DataView(png.buffer).getUint32(offset);
      const type = new TextDecoder().decode(png.subarray(offset + 4, offset + 8));
      if (type === "IDAT") {
        const data = png.slice(offset + 8, offset + 8 + length);
        if (!i) output.push(chunk("IDAT", data));
        else { const sequenced = new Uint8Array(data.length + 4); sequenced.set(u32(sequence++)); sequenced.set(data, 4); output.push(chunk("fdAT", sequenced)); }
      }
      offset += length + 12;
    }
  }
  output.push(chunk("IEND", new Uint8Array()));
  canvas.width = canvas.height = 0;
  return new Blob(output as BlobPart[], { type: "image/apng" });
}
