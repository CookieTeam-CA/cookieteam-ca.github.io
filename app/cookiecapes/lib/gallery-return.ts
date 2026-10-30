const gallery = "/cookiecapes/capes";

export function galleryReturn(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith(gallery + "?")) return gallery;
  const url = new URL(value, "https://cookieattack.de");
  if (url.pathname !== gallery || url.hash) return gallery;
  const query = new URLSearchParams();
  for (const key of ["q", "sort", "order", "page"]) {
    const item = url.searchParams.get(key);
    if (item !== null) query.set(key, item);
  }
  return query.size ? gallery + "?" + query : gallery;
}
