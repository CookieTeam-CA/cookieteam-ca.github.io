import "server-only";
import { API_BASE_URL } from "./api";

export class PreviewError extends Error {
  constructor(readonly status: number) { super(`Preview unavailable (${status})`); }
}

const MAX_BYTES = 2 * 1024 * 1024;
const API_ORIGIN = new URL(API_BASE_URL).origin;
const PROVIDERS = new Set([API_ORIGIN, "https://minotar.net", "https://crafthead.net"]);

async function download(url: string, signal: AbortSignal, skin = false, json = false): Promise<Buffer> {
  const target = new URL(url);
  if (!PROVIDERS.has(target.origin) || target.username || target.password) throw new PreviewError(502);
  const controller = new AbortController();
  const response = await fetch(target, {
    redirect: "error", credentials: "omit", signal: AbortSignal.any([signal, controller.signal]),
    ...(skin ? { next: { revalidate: 3600 } } : { cache: "no-store" as const }),
  });
  if (!response.ok) {
    controller.abort();
    // Aborting can already error the body; cleanup must preserve the upstream status.
    await response.body?.cancel().catch(() => {});
    throw new PreviewError([401, 403, 404].includes(response.status) ? response.status : 502);
  }
  const type = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  const limit = json ? 64 * 1024 : MAX_BYTES;
  if (type !== (json ? "application/json" : "image/png") || Number(response.headers.get("content-length")) > limit) {
    controller.abort();
    await response.body?.cancel().catch(() => {});
    throw new PreviewError(502);
  }
  const reader = response.body?.getReader();
  if (!reader) throw new PreviewError(502);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new PreviewError(502);
      chunks.push(value);
    }
  } catch (error) {
    // Abort the network before cancelling: Next's cache may be reading the other tee branch.
    controller.abort();
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}

async function metadata(path: string, signal: AbortSignal): Promise<Record<string, unknown>> {
  const data: unknown = JSON.parse((await download(`${API_BASE_URL}${path}`, signal, false, true)).toString("utf8"));
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new PreviewError(502);
  return data as Record<string, unknown>;
}

export async function publicCapeTexture(id: number, signal: AbortSignal): Promise<Buffer> {
  // The unauthenticated metadata and PNG endpoints both enforce public visibility.
  const cape = await metadata(`/get_cape?cape_id=${id}`, signal);
  if (cape.is_private || cape.hidden_at || cape.delete_after) throw new PreviewError(404);
  // The API's PNG endpoint resolves animated capes to their poster, without trusting supplied URLs.
  return download(`${API_BASE_URL}/capes/${id}.png`, signal);
}

export async function playerTextures(uuid: string, signal: AbortSignal, hash?: string): Promise<{ skin: Buffer; cape?: Buffer; cacheable: boolean }> {
  const skinUrl = hash ? `https://crafthead.net/skin/${hash}` : `https://minotar.net/skin/${uuid.replaceAll("-", "")}`;
  let cacheable = true;
  const cape = (async () => {
    let player: Record<string, unknown>;
    try {
      player = await metadata(`/get_player?identifier=${uuid}`, signal);
    } catch (error) {
      // Profiles for Minecraft players who have never used CookieCapes still have skins.
      if (error instanceof PreviewError && error.status === 404) return undefined;
      throw error;
    }
    const id = player.cape_id;
    if (id === null || id === -1 || id === 0) return undefined;
    if (typeof id !== "number" || !Number.isSafeInteger(id) || id < 0) throw new PreviewError(502);
    try {
      return await publicCapeTexture(id, signal);
    } catch (error) {
      if (!(error instanceof PreviewError) || ![401, 403, 404].includes(error.status)) throw error;
      // Stale or private cape selections must not hide the player or cache an incomplete outfit.
      cacheable = false;
      return undefined;
    }
  })();
  const [skin, capeBytes] = await Promise.all([download(skinUrl, signal, true), cape]);
  return { skin, cape: capeBytes, cacheable };
}
