const keyPath = (key: string) => key.split("/").map(encodeURIComponent).join("/");
export function decodeKey(segments: string[]): string {
  try { return segments.map(segment => decodeURIComponent(segment)).join("/"); }
  catch { return ""; }
}
export const statHref = (key: string) => `/stats/statistik/${keyPath(key)}`;
export const advancementHref = (key: string) => `/stats/achievements/${keyPath(key)}`;
export const playerHref = (identifier: string) => `/stats/spieler/${encodeURIComponent(identifier)}`;
