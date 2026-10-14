export const API_BASE_URL = "https://api.cookieattack.de:8989";
export const API_STATS_URL = "https://api.cookieattack.de:8990";

export interface StatsResponse {
  online_player_count: number;
  websocket_connection_status: string;
  connected_players_uuids: string[];
}

class CapeApiError extends Error {
  constructor(readonly status: number) { super("Das API-Ergebnis konnte nicht geladen werden."); }
}

async function request<T>(url: string, options: RequestInit & { next?: { revalidate: number } } = {}): Promise<T> {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new CapeApiError(response.status);
  return await response.json();
}

export async function getStats(): Promise<StatsResponse> {
  return await request(`${API_STATS_URL}/stats`, { next: { revalidate: 30 } });
}

export async function getPlayerCount(): Promise<number> {
  const data = await request<PlayersResponse>(`${API_BASE_URL}/list_players_sorted`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 1, offset: 0 }), next: { revalidate: 60 },
  });
  return data.total_count;
}

export interface Cape {
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
    cape_name: string | null;
    last_edited: string | null;
}

export type SortBy = 'active_user_count' | 'last_edited' | 'cape_name' | 'cape_id' | 'minecraft_name';
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
    next: { revalidate: 60 },
  });
  return data.capes.map(cape => ({ ...cape, cape_image_url: `${API_BASE_URL}/capes/${cape.cape_id}.png` }));
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
    ...cape, cape_image_url: `/api/proxy?url=${encodeURIComponent(`${API_BASE_URL}/capes/${cape.cape_id}.png`)}`,
  })) };
}

export async function getPlayersSorted(
  page = 1, limit = 24, sortBy = "minecraft_name", order: Order = "asc", search = "", banned = false,
): Promise<PlayersResponse> {
  return await request(`${API_BASE_URL}/list_players_sorted`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit, offset: (page - 1) * limit, sort_by: sortBy, order, banned, query: search || undefined }),
    next: { revalidate: 0 },
  });
}

export async function getRandomCapes(count = 3): Promise<Cape[]> {
  const allCapes = await getCapes(30);
  const shuffled = allCapes.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function getCape(id: number): Promise<Cape | null> {
  try {
    const data = await request<Cape>(`${API_BASE_URL}/get_cape?cape_id=${id}`, { next: { revalidate: 60 } });
    return { ...data, cape_id: id, count: 0, cape_image_url: `${API_BASE_URL}/capes/${id}.png` };
  } catch (error) {
    if (error instanceof CapeApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getPlayersByCape(capeId: number): Promise<Player[]> {
  const players: Player[] = [];
  for (let page = 1; ; page++) {
    const data = await getPlayersSorted(page, 1000, "minecraft_name", "asc");
    if (data.offset !== (page - 1) * 1000 || !Number.isSafeInteger(data.total_count) || data.total_count < 0) throw new Error("Incomplete player API result");
    players.push(...data.players.filter(player => player.current_cape_id === capeId));
    if (data.offset + data.players.length >= data.total_count) return players;
    if (data.players.length !== 1000) throw new Error("Incomplete player API result");
  }
}

export async function getPlayer(identifier: string): Promise<Player | null> {
  try {
    const data = await request<Player & { cape_id: number | null }>(`${API_BASE_URL}/get_player?identifier=${encodeURIComponent(identifier)}`, { next: { revalidate: 60 } });
    return { ...data, current_cape_id: data.cape_id };
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
    return await request(`https://names.amplitudes.me/api/history/${encodeURIComponent(username)}`, { next: { revalidate: 60 } });
  } catch (error) {
    if (error instanceof CapeApiError && error.status === 404) return null;
    throw error;
  }
}
