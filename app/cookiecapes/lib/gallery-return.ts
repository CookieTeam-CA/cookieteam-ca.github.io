const gallery = "/cookiecapes/capes";

export function galleryReturn(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/cookiecapes/")) return gallery;
  const url = new URL(value, "https://cookieattack.de");
  if (url.origin !== "https://cookieattack.de" || url.hash) return gallery;
  if (url.pathname !== gallery && url.pathname !== "/cookiecapes/players" &&
      !/^\/cookiecapes\/players\/[a-zA-Z0-9_-]+$/.test(url.pathname)) return gallery;
  const query = new URLSearchParams();
  for (const key of ["q", "sort", "order", "page", "banned"]) {
    const item = url.searchParams.get(key);
    if (item !== null) query.set(key, item);
  }
  return url.pathname + (query.size ? "?" + query : "");
}
