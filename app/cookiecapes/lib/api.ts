import { translations, type MessageKey } from "../i18n/messages";
import type { Locale } from "../i18n/locale";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_COOKIECAPES_API_URL || "https://api.cookieattack.de").replace(/\/+$/, "");

export class CapeApiError extends Error {
  constructor(readonly status: number, message: string, readonly retryAfter: string | null = null) { super(message); }
}

export async function capeApiError(response: Response, locale: Locale = "en"): Promise<CapeApiError> {
  const { t } = translations(locale);
  const messages: Record<number, MessageKey> = {
    401: "Sign-in is missing, expired, or invalid.",
    403: "This action is not allowed.",
    400: "Please check your input.",
    422: "Please check your input.",
    413: "The request is too large.",
    429: "Too many requests. Please try again later.",
    469: "The cape was rejected by moderation.",
    503: "An external service is temporarily unavailable.",
  };
  let detail = await response.text();
  try {
    const data = JSON.parse(detail);
    detail = typeof data?.detail === "string" ? data.detail : "";
  } catch { /* The API may also return plain text. */ }
  const retryAfter = response.headers.get("Retry-After");
  let message = messages[response.status] ? t(messages[response.status]) : t("The API request failed (HTTP {status}).", { status: response.status });
  if (detail && !detail.trimStart().startsWith("<")) message += ` ${detail.slice(0, 400)}`;
  if (response.status === 429 && retryAfter) {
    const seconds = /^\d+$/.test(retryAfter) ? Number(retryAfter) : Math.ceil((Date.parse(retryAfter) - Date.now()) / 1000);
    if (Number.isFinite(seconds) && seconds > 0) message += ` ${t("Please wait at least {seconds} seconds before trying again.", { seconds })}`;
  }
  return new CapeApiError(response.status, message, retryAfter);
}

async function request<T>(url: string, options: RequestInit & { next?: { revalidate: number } } = {}): Promise<T> {
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw await capeApiError(response);
    return await response.json();
  } catch (error) {
    if (error instanceof CapeApiError) throw error;
    throw new CapeApiError(0, translations("en").t("The API is temporarily unavailable or returned an invalid response."));
  }
}

export async function getPlayerCount(): Promise<number> {
  const data = await request<PlayersResponse>(`${API_BASE_URL}/list_players_sorted`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 1, offset: 0 }), next: { revalidate: 0 },
  });
  return data.total_count;
}

export type CapeVerification = "unverified" | "website" | "minecraft_session";

export interface Cape {
  animation?: { version: number; revision: string; manifest_url: string; qualities: string[] };
  verification?: CapeVerification;
  cape_id: number;
  cape_name: string;
  minecraft_uuid: string;
  minecraft_name: string;
  last_edited: string;
  count: number;
  cape_image_url: string;
  active_user_count?: number;
}

export interface Player {
    minecraft_uuid: string;
    minecraft_name: string;
    current_cape_id: number | null;
    banned: boolean;
    ban_reason: string;
    cape_image_url?: string | null;
    cape_name: string | null;
    last_edited: string | null;
}

export type SortBy = 'active_user_count' | 'last_edited' | 'cape_name' | 'cape_id';
export type Order = 'asc' | 'desc';

export interface CapesResponse {
    capes: Cape[];
    total_count: number;
    offset: number;
    limit: number;
}

export interface PlayersResponse {
    players: Player[];
    total_count: number;
    offset: number;
    limit: number;
    banned_count: number;
    sort_by: string;
    order: string;
}

export async function getCapes(limit = 10): Promise<Cape[]> {
  const data = await request<CapesResponse>(`${API_BASE_URL}/list_capes_sorted`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit, offset: 0, sort_by: "active_user_count", order: "desc" }),
    next: { revalidate: 0 },
  });
  return data.capes.map(cape => ({ ...cape, cape_image_url: cape.cape_image_url || `${API_BASE_URL}/capes/${cape.cape_id}.png` }));
}

export async function getCapesSorted(
  page = 1, limit = 24, sortBy: SortBy = "active_user_count", order: Order = "desc", search = "", owner?: string,
): Promise<CapesResponse> {
  const data = await request<CapesResponse>(`${API_BASE_URL}/list_capes_sorted`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit, offset: (page - 1) * limit, sort_by: sortBy, order, query: search || undefined, owner }),
    next: { revalidate: 0 },
  });
  return { ...data, capes: data.capes.map(cape => ({
    ...cape, cape_image_url: cape.cape_image_url || `${API_BASE_URL}/capes/${cape.cape_id}.png`,
  })) };
}

export async function getPlayersSorted(
  page = 1, limit = 24, sortBy = "minecraft_name", order: Order = "asc", search = "", banned = false, capeId?: number,
): Promise<PlayersResponse> {
  const data = await request<PlayersResponse>(`${API_BASE_URL}/list_players_sorted`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit, offset: (page - 1) * limit, sort_by: sortBy, order, banned, query: search || undefined, cape_id: capeId }),
    next: { revalidate: 0 },
  });
  return { ...data, players: data.players.map(normalizePlayer) };
}

function normalizePlayer(player: Player): Player {
  return player.current_cape_id === -1
    ? { ...player, current_cape_id: null, cape_image_url: null, cape_name: null, last_edited: null }
    : player;
}

export async function getRandomCapes(count = 3): Promise<Cape[]> {
  const allCapes = await getCapes(30);
  const shuffled = allCapes.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function getCape(id: number): Promise<Cape | null> {
  try {
    const data = await request<Cape>(`${API_BASE_URL}/get_cape?cape_id=${id}`, { next: { revalidate: 0 } });
    return { ...data, cape_id: id, count: data.count ?? 0, cape_image_url: data.cape_image_url || `${API_BASE_URL}/capes/${id}.png` };
  } catch (error) {
    if (error instanceof CapeApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getPlayersByCape(capeId: number, page = 1): Promise<PlayersResponse> {
  return getPlayersSorted(page, 24, "minecraft_name", "asc", "", false, capeId);
}

export async function getPlayer(identifier: string): Promise<Player | null> {
  try {
    const data = await request<Player & { cape_id: number | null }>(`${API_BASE_URL}/get_player?identifier=${encodeURIComponent(identifier)}`, { next: { revalidate: 0 } });
    return normalizePlayer({ ...data, current_cape_id: data.cape_id });
  } catch (error) {
    if (error instanceof CapeApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getCapesByPlayer(owner: string): Promise<Cape[]> {
  const capes: Cape[] = [];
  for (let page = 1; ; page++) {
    const data = await getCapesSorted(page, 1000, "last_edited", "desc", "", owner);
    if (data.offset !== (page - 1) * 1000 || !Number.isSafeInteger(data.total_count) || data.total_count < 0) throw new Error("Incomplete cape API result");
    capes.push(...data.capes);
    if (data.offset + data.capes.length >= data.total_count) return capes;
    if (data.capes.length !== 1000) throw new Error("Incomplete cape API result");
  }
}

// --- Player History (names.amplitudes.me) ---

export interface UsernameHistoryEntry {
    username: string;
    changed_at: string | null;
}

export interface SkinHistoryEntry {
    hash: string;
    changed_at: string;
    slim: boolean;
}

export interface SocialEntry {
    type: string;
    name: string;
    verified: boolean;
}

export interface PlayerHistory {
    uuid: string;
    current_username: string;
    username_history: UsernameHistoryEntry[];
    skin_history: SkinHistoryEntry[];
    socials: SocialEntry[];
    country: string | null;
}

export async function getPlayerHistory(username: string): Promise<PlayerHistory | null> {
  try {
    const data = await request<PlayerHistory>(`https://names.amplitudes.me/api/history/${encodeURIComponent(username)}`, { next: { revalidate: 0 } });
    if (!data || typeof data.uuid !== "string" || typeof data.current_username !== "string"
      || !(data.country === null || (typeof data.country === "string" && /^[A-Za-z]{2}$/.test(data.country)))
      || !Array.isArray(data.username_history) || !data.username_history.every(entry => entry && typeof entry.username === "string" && (entry.changed_at === null || typeof entry.changed_at === "string"))
      || !Array.isArray(data.skin_history) || !data.skin_history.every(entry => entry && typeof entry.hash === "string" && typeof entry.changed_at === "string" && typeof entry.slim === "boolean")
      || !Array.isArray(data.socials) || !data.socials.every(entry => entry && typeof entry.type === "string" && typeof entry.name === "string" && typeof entry.verified === "boolean")) {
      throw new CapeApiError(0, translations("en").t("The API is temporarily unavailable or returned an invalid response."));
    }
    return data;
  } catch (error) {
    if (error instanceof CapeApiError && error.status === 404) return null;
    throw error;
  }
}
