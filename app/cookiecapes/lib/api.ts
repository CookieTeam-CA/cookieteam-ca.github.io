export const API_BASE_URL = "https://api.cookieattack.de:8989";
export const API_STATS_URL = "https://api.cookieattack.de:8990";

export interface StatsResponse {
  online_player_count: number;
  websocket_connection_status: string;
  connected_players_uuids: string[];
}

export async function getStats(): Promise<StatsResponse | null> {
    try {
        const res = await fetch(`${API_STATS_URL}/stats`, { next: { revalidate: 30 } });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch stats:", error);
        return null;
    }
}

export async function getPlayerCount(): Promise<number> {
    try {
        const res = await fetch(`${API_BASE_URL}/list_players_sorted`, {
            method: 'POST',
             headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
             next: { revalidate: 60 }
        });

        if (!res.ok) return 0;
        const data = await res.json();
        return data.total_count || 0;
    } catch (error) {
        console.error("Failed to fetch player count:", error);
        return 0;
    }
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
  try {
    const res = await fetch(`${API_BASE_URL}/list_capes_sorted`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: limit,
        sort_by: "active_user_count",
        order: "desc",
        offset: 0
      }),
      next: { revalidate: 60 },
    });
    
    if (!res.ok) {
        console.error(`API Error: ${res.status} ${res.statusText}`);
        return [];
    }
    
    const data = await res.json();
    return data.capes || [];
  } catch (error) {
    console.error("Failed to fetch capes:", error);
    return [];
  }
}

export async function getCapesSorted(
    page = 1, 
    limit = 24, 
    sortBy: SortBy = 'active_user_count', 
    order: Order = 'desc',
    search: string = ''
): Promise<CapesResponse | null> {
    try {
        const offset = (page - 1) * limit;
        const body: any = {
            limit,
            offset,
            sort_by: sortBy,
            order
        };

        if (search) {
            body.query = search;
        }

        const res = await fetch(`${API_BASE_URL}/list_capes_sorted`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            next: { revalidate: 0 }
        });

        if (!res.ok) return null;
        
        const data = await res.json();
        
        if (data && data.capes) {
            data.capes = data.capes.map((cape: Cape) => ({
                ...cape,
                cape_image_url: `/api/proxy?url=${encodeURIComponent(`https://api.cookieattack.de:8989/capes/${cape.cape_id}.png`)}`
            }));
        }

        return data;
    } catch (error) {
        console.error("Failed to fetch sorted capes:", error);
        return null;
    }
}

export async function getPlayersSorted(
    page = 1,
    limit?: number,
    sortBy: string = 'minecraft_name',
    order: Order = 'asc',
    search: string = '',
    banned: boolean = false
): Promise<PlayersResponse | null> {
    try {
        const body: any = {
            sort_by: sortBy,
            order,
            banned
        };

        if (limit !== undefined) {
            body.limit = limit;
            body.offset = (page - 1) * limit;
        }

        if (search) {
            body.query = search;
        }

        const res = await fetch(`${API_BASE_URL}/list_players_sorted`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            next: { revalidate: 0 }
        });

        if (!res.ok) return null;

        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch sorted players:", error);
        return null;
    }
}

export async function getRandomCapes(count = 3): Promise<Cape[]> {
  const allCapes = await getCapes(30); 
  if (allCapes.length === 0) return [];
  
  const shuffled = allCapes.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function getCape(id: number): Promise<Cape | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/get_cape?cape_id=${id}`, {
            next: { revalidate: 60 }
        });
        
        if (!res.ok) return null;
        
        const data = await res.json();
        
        const imageUrl = `https://api.cookieattack.de:8989/capes/${id}.png`;

        return {
            cape_id: id,
            cape_name: data.cape_name,
            minecraft_uuid: data.minecraft_uuid,
            minecraft_name: data.minecraft_name,
            last_edited: data.last_edited,
            count: 0,
            active_user_count: 0,
            cape_image_url: imageUrl
        };
    } catch (error) {
        console.error("Failed to fetch cape:", error);
        return null;
    }
}

export async function getPlayersByCape(capeId: number): Promise<Player[]> {
    try {
        const res = await getPlayersSorted(1, 1000, 'minecraft_name', 'asc');
        
        if (res && res.players) {
            return res.players.filter(p => p.current_cape_id === capeId);
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch players by cape:", error);
        return [];
    }
}

export async function getPlayer(identifier: string): Promise<Player | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/get_player?identifier=${identifier}`, {
            next: { revalidate: 60 }
        });
        
        if (!res.ok) return null;
        
        const data = await res.json();
        
        return {
            ...data,
            current_cape_id: data.cape_id
        }; 
    } catch (error) {
        console.error("Failed to fetch player:", error);
        return null;
    }
}

export async function getCapesByPlayer(playerName: string): Promise<Cape[]> {
    try {
        const res = await getCapesSorted(1, 1000, 'last_edited', 'desc');
        
        if (res && res.capes) {
            return res.capes.filter(c => c.minecraft_name.toLowerCase() === playerName.toLowerCase());
        }
        
        return [];
    } catch (error) {
        console.error("Failed to fetch capes by player:", error);
        return [];
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
        const res = await fetch(`https://names.amplitudes.me/api/history/${encodeURIComponent(username)}`, {
            next: { revalidate: 60 }
        });

        if (!res.ok) return null;

        return await res.json();
    } catch (error) {
        console.error("Failed to fetch player history:", error);
        return null;
    }
}
