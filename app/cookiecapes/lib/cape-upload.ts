import { MAX_FRAMES, MAX_UPLOAD_BYTES } from "./animation-manifest";
import { translations } from "../i18n/messages";

export type CapeImportMode = "auto" | "image" | "frames" | "sheet";
export interface CapeSelection { files: File[]; mode: "static" | "image" | "frames" | "sheet" }

/** Detect containers from their bytes, so an animated PNG never becomes a static upload. */
export async function selectCapeFiles(files: File[], mode: CapeImportMode = "auto", t = translations("en").t): Promise<CapeSelection> {
  if (!files.length || files.length > MAX_FRAMES || files.some(file => !file.size) || files.reduce((sum, file) => sum + file.size, 0) > MAX_UPLOAD_BYTES) throw new Error(t("Please choose up to 200 frames totaling no more than 32 MiB."));
  const normalized: File[] = [];
  let animated = false;
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const text = (a: number, b: number) => new TextDecoder().decode(bytes.subarray(a, b));
    let type = file.type;
    if (bytes.length >= 24 && bytes[0] === 137 && text(1, 8) === "PNG\r\n\x1a\n") {
      type = "image/png";
      const view = new DataView(bytes.buffer);
      for (let offset = 8; offset + 12 <= bytes.length;) {
        const length = view.getUint32(offset);
        if (length > bytes.length - offset - 12) throw new Error(t("The PNG file is corrupt."));
        if (text(offset + 4, offset + 8) === "acTL") animated = true;
        offset += length + 12;
      }
    } else if (/^GIF8[79]a$/.test(text(0, 6))) { type = "image/gif"; animated = true; }
    else if (text(0, 4) === "RIFF" && text(8, 12) === "WEBP") {
      type = "image/webp";
      animated ||= text(12, 16) === "VP8X" && !!(bytes[20] & 2);
    }
    else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) type = "image/jpeg";
    if (!type.startsWith("image/")) throw new Error(t("Please choose an image file."));
    normalized.push(new File([file], file.name, { type }));
  }
  const selected = mode === "auto" ? files.length > 1 ? "frames" : animated ? "image" : "static" : mode;
  if ((selected === "image" || selected === "sheet") && files.length !== 1) throw new Error(t("Please choose a single animation or sprite sheet."));
  if ((selected === "frames" || selected === "sheet") && normalized.some(file => file.type !== "image/png")) throw new Error(t("Please use PNG files for frames and sprite sheets."));
  if (selected === "static" && files[0].size > 3 * 1024 * 1024) throw new Error(t("Static capes must not exceed 3 MiB."));
  return { files: normalized, mode: selected };
}
