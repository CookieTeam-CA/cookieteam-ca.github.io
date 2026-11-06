import { translations } from "../i18n/messages";
import { CapeApiError, capeApiError } from "./api-error";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_COOKIECAPES_API_URL || "https://api.cookieattack.de").replace(/\/+$/, "");

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

export async function getCapesSorted(
  page = 1, limit = 24, sortBy: SortBy = "active_user_count", order: Order = "desc", search = "", owner?: string, ids?: number[],
): Promise<CapesResponse> {
  const data = await request<CapesResponse>(`${API_BASE_URL}/list_capes_sorted`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit, offset: (page - 1) * limit, sort_by: sortBy, order, query: search || undefined, owner, ids }),
    next: { revalidate: 0 },
  });
  return { ...data, capes: data.capes.map(cape => ({
    ...cape, cape_image_url: cape.cape_image_url || `${API_BASE_URL}/capes/${cape.cape_id}.png`,
  })) };
}

export async function getCapeSearchMatch(search: string): Promise<Cape | undefined> {
  const query = search.trim();
  if (!/^\d+$/.test(query) || !Number.isSafeInteger(Number(query))) return undefined;
  const data = await getCapesSorted(1, 1, "cape_id", "asc", "", undefined, [Number(query)]);
  return data.capes[0];
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
  return player.current_cape_id === -1 || player.current_cape_id === 0
    ? { ...player, current_cape_id: null, cape_image_url: null, cape_name: null, last_edited: null }
    : player;
}

export async function getRandomCapes(count = 3): Promise<Cape[]> {
  const { capes } = await getCapesSorted(1, 30);
  const shuffled = capes.sort(() => 0.5 - Math.random());
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
    const player = normalizePlayer({ ...data, current_cape_id: data.cape_id });
    if (player.current_cape_id != null && !player.cape_name) {
      const { capes } = await getCapesSorted(1, 1, "cape_id", "asc", "", undefined, [player.current_cape_id]);
      const cape = capes[0];
      if (cape) return { ...player, cape_name: cape.cape_name, cape_image_url: cape.cape_image_url, last_edited: cape.last_edited };
    }
    return player;
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
    const data = await request<Omit<PlayerHistory, "country"> & { country?: string | null; inferred_country?: string | null }>(`https://names.amplitudes.me/api/history/${encodeURIComponent(username)}`, { next: { revalidate: 0 } });
    const country = data?.country ?? data?.inferred_country ?? null;
    if (!data || typeof data.uuid !== "string" || typeof data.current_username !== "string"
      || !(country === null || (typeof country === "string" && /^[A-Za-z]{2}$/.test(country)))
      || !Array.isArray(data.username_history) || !data.username_history.every(entry => entry && typeof entry.username === "string" && (entry.changed_at === null || typeof entry.changed_at === "string"))
      || !Array.isArray(data.skin_history) || !data.skin_history.every(entry => entry && typeof entry.hash === "string" && typeof entry.changed_at === "string" && typeof entry.slim === "boolean")
      || !Array.isArray(data.socials) || !data.socials.every(entry => entry && typeof entry.type === "string" && typeof entry.name === "string" && typeof entry.verified === "boolean")) {
      throw new CapeApiError(0, translations("en").t("The API is temporarily unavailable or returned an invalid response."));
    }
    return { ...data, country };
  } catch (error) {
    if (error instanceof CapeApiError && error.status === 404) return null;
    throw error;
  }
}
