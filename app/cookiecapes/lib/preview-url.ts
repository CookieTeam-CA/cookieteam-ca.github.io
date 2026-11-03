const PREVIEW_BASE = "/api/cookiecapes/previews";

export function capePreviewUrl(id: number, edited?: string | null): string {
  return `${PREVIEW_BASE}/capes/${id}${edited ? `?edited=${encodeURIComponent(edited)}` : ""}`;
}

export function playerPreviewUrl(uuid: string, edited?: string | null, skin?: { hash: string; slim?: boolean }): string {
  const query = new URLSearchParams();
  if (edited) query.set("edited", edited);
  if (skin) {
    query.set("skin", skin.hash);
    if (skin.slim !== undefined) query.set("slim", String(skin.slim));
  }
  return `${PREVIEW_BASE}/players/${uuid}${query.size ? `?${query}` : ""}`;
}
