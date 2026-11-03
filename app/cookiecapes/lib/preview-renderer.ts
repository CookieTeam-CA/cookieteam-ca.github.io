import "server-only";
import sharp from "sharp";

type Vec = [number, number, number];
type Rect = [number, number, number, number];
interface Texture { pixels: Buffer; width: number; height: number; scale: number; legacy: boolean }
interface Patch { depth: number; svg: string }

const MAX_PIXELS = 4096 * 4096;
const SHARP_OPTIONS = { limitInputPixels: MAX_PIXELS, failOn: "warning" as const };
const YAW = Math.PI / 6;
const PITCH = Math.PI / 15;
const camera: Vec = [Math.sin(YAW) * Math.cos(PITCH), -Math.sin(PITCH), -Math.cos(YAW) * Math.cos(PITCH)];
const dot = (a: Vec, b: Vec) => a.reduce((sum, n, i) => sum + n * b[i], 0);
const add = (a: Vec, b: Vec): Vec => a.map((n, i) => n + b[i]) as Vec;
const multiply = (a: Vec, n: number): Vec => a.map(v => v * n) as Vec;

async function decode(bytes: Buffer, kind: "skin" | "cape"): Promise<Texture> {
  const image = sharp(bytes, SHARP_OPTIONS).timeout({ seconds: 2 });
  const metadata = await image.metadata();
  const { width = 0, height = 0 } = metadata;
  if (metadata.format !== "png" || (metadata.pages ?? 1) !== 1 || width > 4096 || height > 4096) throw new Error("Unsupported texture");
  let baseWidth = 64;
  let baseHeight = kind === "skin" && width === height ? 64 : 32;
  if (kind === "cape") {
    if (width * 17 === height * 22) { baseWidth = 22; baseHeight = 17; }
    else if (width * 11 === height * 23) { baseWidth = 46; baseHeight = 22; }
  }
  if (!width || width % baseWidth || width / baseWidth !== height / baseHeight) throw new Error("Invalid texture dimensions");
  const pixels = await image.toColourspace("srgb").ensureAlpha().raw().toBuffer();
  return { pixels, width, height, scale: width / baseWidth, legacy: kind === "skin" && baseHeight === 32 };
}

function pixel(texture: Texture, x: number, y: number): number[] {
  if (x < 0 || y < 0 || x >= texture.width || y >= texture.height) return [0, 0, 0, 0];
  return [...texture.pixels.subarray((y * texture.width + x) * 4, (y * texture.width + x) * 4 + 4)];
}

function normalizeSkin(texture: Texture): Texture {
  const scale = texture.scale;
  if (texture.pixels.every((value, index) => index % 4 !== 3 || value === 255)) {
    // Old editors fill unused overlay pixels; match Minecraft's opaque-background cleanup.
    const areas = texture.legacy ? [[32, 0, 32, 16]] : [[32, 0, 32, 16], [0, 32, 64, 16], [0, 48, 16, 16], [48, 48, 16, 16]];
    for (const [x, y, w, h] of areas) for (let dy = 0; dy < h * scale; dy++) for (let dx = 0; dx < w * scale; dx++) {
      texture.pixels[((y * scale + dy) * texture.width + x * scale + dx) * 4 + 3] = 0;
    }
  }
  if (!texture.legacy) return texture;
  const pixels = Buffer.alloc(texture.width * texture.width * 4);
  texture.pixels.copy(pixels);
  // Legacy left limbs mirror each face of the right limbs, exchanging their side faces.
  for (const [sx, sy, w, h, dx, dy] of [
    [4, 16, 4, 4, 20, 48], [8, 16, 4, 4, 24, 48],
    [0, 20, 4, 12, 24, 52], [4, 20, 4, 12, 20, 52], [8, 20, 4, 12, 16, 52], [12, 20, 4, 12, 28, 52],
    [44, 16, 4, 4, 36, 48], [48, 16, 4, 4, 40, 48],
    [40, 20, 4, 12, 40, 52], [44, 20, 4, 12, 36, 52], [48, 20, 4, 12, 32, 52], [52, 20, 4, 12, 44, 52],
  ]) {
    for (let y = 0; y < h * scale; y++) for (let x = 0; x < w * scale; x++) {
      pixels.set(pixel(texture, (sx + w) * scale - x - 1, sy * scale + y), ((dy * scale + y) * texture.width + dx * scale + x) * 4);
    }
  }
  return { ...texture, pixels, height: texture.width };
}

function inferSlim(texture: Texture): boolean {
  if (texture.legacy) return false;
  const colors: number[][] = [];
  for (const [x, y, w, h] of [[50, 16, 2, 4], [54, 20, 2, 12], [42, 48, 2, 4], [46, 52, 2, 12]]) {
    for (let dy = 0; dy < h * texture.scale; dy++) for (let dx = 0; dx < w * texture.scale; dx++) colors.push(pixel(texture, x * texture.scale + dx, y * texture.scale + dy));
  }
  return colors.some(c => c[3] !== 255) || colors.every(c => c.slice(0, 3).every(n => n === 0)) || colors.every(c => c.every(n => n === 255));
}

function project([x, y, z]: Vec, capeOnly: boolean): [number, number] {
  const scale = capeOnly ? 23 : 12;
  const centerY = capeOnly ? 8 : 16;
  return [192 + (-Math.cos(YAW) * x - Math.sin(YAW) * z) * scale,
    256 + (Math.cos(PITCH) * (y - centerY) + Math.sin(PITCH) * (Math.sin(YAW) * x - Math.cos(YAW) * z)) * scale];
}

async function cuboid(patches: Patch[], texture: Texture, origin: Vec, size: Vec, uv: [number, number], dimensions: Vec, capeOnly: boolean, deadline: number, inflate = 0, cape?: "standalone" | "worn", opaque = false) {
  const [w, h, d] = dimensions;
  const [u, v] = uv;
  const [sx, sy, sz] = size.map(n => n + 2 * inflate) as Vec;
  const faces: { p: Vec; a: Vec; b: Vec; n: Vec; uv: Rect; shade: number }[] = [
    { p: [-sx / 2, -inflate, sz / 2], a: [sx, 0, 0], b: [0, sy, 0], n: [0, 0, 1], uv: [u + d, v + d, w, h], shade: cape ? 1 : .9 },
    { p: [sx / 2, -inflate, -sz / 2], a: [-sx, 0, 0], b: [0, sy, 0], n: [0, 0, -1], uv: [u + 2 * d + w, v + d, w, h], shade: cape ? .9 : 1 },
    { p: [sx / 2, -inflate, sz / 2], a: [0, 0, -sz], b: [0, sy, 0], n: [1, 0, 0], uv: [u + d + w, v + d, d, h], shade: .78 },
    { p: [-sx / 2, -inflate, -sz / 2], a: [0, 0, sz], b: [0, sy, 0], n: [-1, 0, 0], uv: [u, v + d, d, h], shade: .78 },
    { p: [-sx / 2, -inflate, -sz / 2], a: [sx, 0, 0], b: [0, 0, sz], n: [0, -1, 0], uv: [u + d, v, w, d], shade: 1 },
    { p: [-sx / 2, sy - inflate, sz / 2], a: [sx, 0, 0], b: [0, 0, -sz], n: [0, 1, 0], uv: [u + d + w, v, w, d], shade: .65 },
  ];
  const rotate = ([x, y, z]: Vec): Vec => {
    // Match skinview3d's cape.rotation.y = Math.PI before applying the hanging angle.
    if (cape) { x = -x; z = -z; }
    return cape === "worn" ? [x, y * Math.cos(.1885) + z * Math.sin(.1885), -y * Math.sin(.1885) + z * Math.cos(.1885)] : [x, y, z];
  };
  for (const face of faces) {
    if (dot(rotate(face.n), camera) <= 0) continue;
    if (performance.now() > deadline) throw new Error("Render deadline exceeded");
    const [tx, ty, tw, th] = face.uv;
    const at = (dx: number, dy: number) => add(origin, rotate(add(face.p, add(multiply(face.a, dx / tw), multiply(face.b, dy / th)))));
    const [p, a, b] = [at(0, 0), at(tw, 0), at(0, th)].map(p => project(p, capeOnly));
    const matrix = [(a[0] - p[0]) / tw, (a[1] - p[1]) / tw, (b[0] - p[0]) / th, (b[1] - p[1]) / th, ...p].map(n => n.toFixed(5)).join(" ");
    const scale = texture.scale;
    // Crop before projection so sampling cannot bleed artwork from an adjacent atlas face.
    const image = sharp(texture.pixels, { raw: { width: texture.width, height: texture.height, channels: 4 } })
      .timeout({ seconds: 2 })
      .extract({ left: tx * scale, top: ty * scale, width: tw * scale, height: th * scale });
    // Minecraft's base skin is opaque; only the outer skin layer and cape use alpha.
    if (opaque) image.removeAlpha();
    const png = await image.linear(face.shade, face.shade === 1 ? 0 : .5).png({ compressionLevel: 1 }).toBuffer();
    patches.push({ depth: dot(at(tw / 2, th / 2), camera), svg: `<image width="${tw}" height="${th}" transform="matrix(${matrix})" style="image-rendering:pixelated" href="data:image/png;base64,${png.toString("base64")}"/>` });
  }
}

export async function renderPreview({ skin, cape, slim }: { skin?: Buffer; cape?: Buffer; slim?: boolean }): Promise<Buffer> {
  const start = performance.now();
  const [decodedSkin, capeTexture] = await Promise.all([skin ? decode(skin, "skin") : undefined, cape ? decode(cape, "cape") : undefined]);
  if (!decodedSkin && !capeTexture) throw new Error("Missing texture");
  const patches: Patch[] = [];
  const skinTexture = decodedSkin ? normalizeSkin(decodedSkin) : undefined;
  if (decodedSkin) {
    const texture = skinTexture!;
    const arm = (decodedSkin.legacy ? false : slim ?? inferSlim(texture)) ? 3 : 4;
    const parts: { p: Vec; d: Vec; uv: [number, number]; overlay: [number, number]; inflate: number }[] = [
      { p: [0, 0, 0], d: [8, 8, 8], uv: [0, 0], overlay: [32, 0], inflate: .5 },
      { p: [0, 8, 0], d: [8, 12, 4], uv: [16, 16], overlay: [16, 32], inflate: .25 },
      { p: [-4 - arm / 2, 8, 0], d: [arm, 12, 4], uv: [40, 16], overlay: [40, 32], inflate: .25 },
      { p: [4 + arm / 2, 8, 0], d: [arm, 12, 4], uv: [32, 48], overlay: [48, 48], inflate: .25 },
      { p: [-2, 20, 0], d: [4, 12, 4], uv: [0, 16], overlay: [0, 32], inflate: .25 },
      { p: [2, 20, 0], d: [4, 12, 4], uv: [16, 48], overlay: [0, 48], inflate: .25 },
    ];
    for (const part of parts) {
      await cuboid(patches, texture, part.p, part.d, part.uv, part.d, false, start + 2500, 0, undefined, true);
      if (!texture.legacy || part.uv[1] === 0) await cuboid(patches, texture, part.p, part.d, part.overlay, part.d, false, start + 2500, part.inflate);
    }
  }
  if (capeTexture) await cuboid(patches, capeTexture, decodedSkin ? [0, 8, -2.6] : [0, 0, 0], [10, 16, 1], [0, 0], [10, 16, 1], !decodedSkin, start + 2500, 0, decodedSkin ? "worn" : "standalone");
  patches.sort((a, b) => a.depth - b.depth);
  if (performance.now() - start > 2500) throw new Error("Render deadline exceeded");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="384" height="512" viewBox="0 0 384 512" shape-rendering="crispEdges">${patches.map(p => p.svg).join("")}</svg>`;
  return sharp(Buffer.from(svg), SHARP_OPTIONS).timeout({ seconds: 2 }).png().toBuffer();
}
