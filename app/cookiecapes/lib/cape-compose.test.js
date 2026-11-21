import { expect, test } from "bun:test";
import { atlasFromFace, classifySource, cropRect, DEFAULT_FRAMING, innerColour, isPixelArt, opaqueCoverage, panFraming, resampleTimeline, zoomFraming } from "./cape-compose";

function face(k, pixel) {
  const width = 10 * k, height = 16 * k, data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data.set(pixel(x, y), (y * width + x) * 4);
  return { data, width, height };
}
const at = (image, x, y) => [...image.data.subarray((y * image.width + x) * 4, (y * image.width + x) * 4 + 4)];

test("fill crops the largest centred 5:8 rectangle", () => {
  expect(cropRect(1600, 900, DEFAULT_FRAMING)).toEqual({ x: 518.75, y: 0, width: 562.5, height: 900 });
  expect(cropRect(500, 1600, DEFAULT_FRAMING)).toEqual({ x: 0, y: 400, width: 500, height: 800 });
});

test("fit contains the whole image and can extend beyond it", () => {
  const rect = cropRect(1600, 900, { ...DEFAULT_FRAMING, fit: "fit" });
  expect(rect.width).toBe(1600);
  expect(rect.height).toBe(2560);
  expect(rect.y).toBe(-830);
});

test("panning is clamped to the image and does not accumulate past edges", () => {
  const far = panFraming(1600, 900, DEFAULT_FRAMING, 10000, 0);
  expect(cropRect(1600, 900, far).x).toBeCloseTo(1600 - 562.5);
  const back = panFraming(1600, 900, far, -100, 0);
  expect(cropRect(1600, 900, back).x).toBeCloseTo(1600 - 562.5 - 100);
});

test("zoom shrinks the crop and is limited to 1–8", () => {
  expect(cropRect(1600, 900, zoomFraming(1600, 900, DEFAULT_FRAMING, 2)).width).toBe(281.25);
  expect(zoomFraming(1600, 900, DEFAULT_FRAMING, 50).zoom).toBe(8);
  expect(zoomFraming(1600, 900, DEFAULT_FRAMING, 0.1).zoom).toBe(1);
});

test("cape layouts are detected as finished textures", () => {
  expect(classifySource(64, 32)).toBe("texture");
  expect(classifySource(512, 256)).toBe("texture");
  expect(classifySource(352, 272)).toBe("texture");
  expect(classifySource(46, 22)).toBe("texture");
  expect(classifySource(1920, 1080)).toBe("artwork");
  expect(classifySource(100, 50)).toBe("artwork");
  expect(isPixelArt(64, 64)).toBe(true);
  expect(isPixelArt(1920, 1080)).toBe(false);
});

test("the atlas places the face, edge strips and darkened inner face", () => {
  const k = 2;
  const source = face(k, (x, y) => [x, y, 200, 255]);
  const atlas = atlasFromFace(source, k);
  expect([atlas.width, atlas.height]).toEqual([128, 64]);
  expect(at(atlas, k, k)).toEqual([0, 0, 200, 255]);
  expect(at(atlas, k + 19, k + 31)).toEqual([19, 31, 200, 255]);
  expect(at(atlas, 0, k + 5)).toEqual([0, 5, 200, 255]);
  expect(at(atlas, 1, k + 5)).toEqual([0, 5, 200, 255]);
  expect(at(atlas, 11 * k + 1, k + 5)).toEqual([19, 5, 200, 255]);
  expect(at(atlas, k + 7, 0)).toEqual([7, 0, 200, 255]);
  expect(at(atlas, 11 * k + 7, 1)).toEqual([7, 31, 200, 255]);
  const [r, g, b, a] = innerColour(source);
  expect(at(atlas, 12 * k, k)).toEqual([r, g, b, a]);
  expect(b).toBe(120);
  expect(at(atlas, 22 * k, 0)).toEqual([0, 0, 0, 0]);
  expect(at(atlas, 63 * k, 31 * k)).toEqual([0, 0, 0, 0]);
});

test("the inner face ignores transparent pixels and stays clear for an empty face", () => {
  expect(innerColour(face(1, x => x < 5 ? [100, 100, 100, 255] : [255, 0, 0, 0]))).toEqual([60, 60, 60, 255]);
  expect(innerColour(face(1, () => [255, 255, 255, 0]))).toEqual([0, 0, 0, 0]);
  expect(opaqueCoverage(face(1, x => x < 5 ? [0, 0, 0, 255] : [0, 0, 0, 0]))).toBe(0.5);
});

test("the atlas rejects a face of the wrong size", () => {
  expect(() => atlasFromFace(face(1, () => [0, 0, 0, 255]), 2)).toThrow();
});

test("timelines keep their duration while dropping to 24 FPS and 200 frames", () => {
  expect(resampleTimeline([100, 200])).toEqual([{ index: 0, duration: 100 }, { index: 1, duration: 200 }]);
  const fast = resampleTimeline(Array(60).fill(1000 / 60));
  expect(fast.length).toBe(24);
  expect(fast.reduce((sum, item) => sum + item.duration, 0)).toBeCloseTo(1000);
  expect(fast.every(item => item.duration >= 1000 / 24 - 1e-9)).toBe(true);
  const long = resampleTimeline(Array(500).fill(100));
  expect(long.length).toBe(200);
  expect(long.reduce((sum, item) => sum + item.duration, 0)).toBeCloseTo(50000);
  expect(long.at(-1).index).toBeGreaterThan(490);
  const still = resampleTimeline([10, 10, 10, 5000]);
  expect(still.every((item, i) => i === 0 || item.index !== still[i - 1].index)).toBe(true);
});
