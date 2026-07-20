// Client for the Minecraft Stats and Leaderboards API

const API_BASE_URL =
  process.env.COOKIEATTACK_STATS_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "http://api.cookieattack.de:8100"
    : "http://localhost:8000");

function getHeaders() {
  const token = process.env.COOKIEATTACK_BACKEND_KEY || "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Helper to make fetch requests
async function fetchFromApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText} at ${url}`);
  }

  return response.json() as Promise<T>;
}

// Interfaces
export interface PointsLeaderboardEntry {
  rank: number;
  uuid: string;
  player: string;
  points: number;
}

export interface StatsOverviewEntry {
  stat: string;
  leader: string;
  value: number;
}

export interface AdvancementsLeaderboardEntry {
  rank: number;
  player: string;
  completed: number;
  percentage: number;
}

export interface StatInfo {
  id: string;
  display_name: string;
  category: string;
}

export interface StatLeaderboardEntry {
  rank: number;
  uuid: string;
  username: string;
  value: number;
}

export interface StatDetails {
  leader: string;
  highest_value: number;
  average: number;
  category: string;
}

export interface PlayerSearchEntry {
  id: number;
  uuid: string;
  username: string;
  last_sync: string;
}

export interface PlayerSearchResponse {
  players: PlayerSearchEntry[];
}

export interface PlayerProfile {
  uuid: string;
  name: string;
  points: number;
  rank: number;
  advancement_completion: number;
}

export interface PlayerPointsBreakdown {
  total: number;
  stats: {
    gold: number;
    silver: number;
    bronze: number;
    points: number;
  };
  advancements: {
    gold: number;
    silver: number;
    bronze: number;
    points: number;
  };
}

export interface PlayerStatsResponse {
  uuid: string;
  username: string;
  last_sync: string;
  stats: Record<string, number>;
}

export interface PlayerAchievementsResponse {
  uuid: string;
  username: string;
  last_sync: string;
  achievements_count: number;
  total_achievements: number;
  percentage: number;
  achievements: Array<{
    achievement: string;
    display_name: string;
    description: string | null;
    unlocked_at: string;
  }>;
}

export interface PlayerAdvancementEntry {
  achievement: string;
  display_name: string;
  description: string | null;
  unlocked_at: string;
}

export interface PlayerAdvancementsResponse {
  uuid: string;
  name: string;
  advancements: PlayerAdvancementEntry[];
}

export interface AdvancementInfo {
  id: string;
  display_name: string;
  description: string | null;
  tab: string; // nether, story, end etc.
  points: number;
}

export interface AdvancementLeaderboardEntry {
  rank: number;
  player: string;
  completed_at: string;
}

// API functions
export async function getPointsLeaderboard(): Promise<PointsLeaderboardEntry[]> {
  return fetchFromApi<PointsLeaderboardEntry[]>("/leaderboards/points");
}

export async function getStatsOverview(): Promise<StatsOverviewEntry[]> {
  return fetchFromApi<StatsOverviewEntry[]>("/leaderboards/stats");
}

export async function getAdvancementsOverview(): Promise<AdvancementsLeaderboardEntry[]> {
  return fetchFromApi<AdvancementsLeaderboardEntry[]>("/leaderboards/advancements");
}

export async function getAllStats(category?: string, search?: string): Promise<StatInfo[]> {
  const query = new URLSearchParams();
  if (category) query.append("category", category);
  if (search) query.append("search", search);
  const queryString = query.toString();
  return fetchFromApi<StatInfo[]>(`/stats${queryString ? `?${queryString}` : ""}`);
}

export async function getStatLeaderboard(
  statKey: string,
  page = 1,
  limit = 50
): Promise<StatLeaderboardEntry[]> {
  // If the stat key contains a slash, it's structured like minecraft:crafted/minecraft:birch_button.
  // The backend supports /stats/{cat}/{stat}/leaderboard or /stats/{stat}/leaderboard
  let path = `/stats/${encodeURIComponent(statKey)}/leaderboard`;
  if (statKey.includes("/")) {
    const parts = statKey.split("/");
    if (parts.length === 2) {
      path = `/stats/${parts[0]}/${parts[1]}/leaderboard`;
    }
  }
  const query = new URLSearchParams();
  if (page) query.append("page", page.toString());
  if (limit) query.append("limit", limit.toString());
  const queryString = query.toString();
  return fetchFromApi<StatLeaderboardEntry[]>(`${path}${queryString ? `?${queryString}` : ""}`);
}

export async function getStatInfo(statKey: string): Promise<StatDetails> {
  let path = `/stats/${encodeURIComponent(statKey)}`;
  if (statKey.includes("/")) {
    const parts = statKey.split("/");
    if (parts.length === 2) {
      path = `/stats/${parts[0]}/${parts[1]}`;
    }
  }
  return fetchFromApi<StatDetails>(path);
}

export async function searchPlayer(searchQuery: string): Promise<PlayerSearchResponse> {
  const query = new URLSearchParams();
  if (searchQuery) query.append("search", searchQuery);
  return fetchFromApi<PlayerSearchResponse>(`/ca6/players/${query.toString() ? `?${query.toString()}` : ""}`);
}

export async function getPlayerProfile(identifier: string): Promise<PlayerProfile> {
  return fetchFromApi<PlayerProfile>(`/ca6/players/${encodeURIComponent(identifier)}`);
}

export async function getPlayerStats(identifier: string): Promise<PlayerStatsResponse> {
  return fetchFromApi<PlayerStatsResponse>(`/ca6/players/${encodeURIComponent(identifier)}/stats`);
}

export async function getPlayerStatRank(
  identifier: string,
  statKey: string
): Promise<{ uuid: string; stat: string; value: number; rank: number }> {
  return fetchFromApi<{ uuid: string; stat: string; value: number; rank: number }>(
    `/ca6/players/${encodeURIComponent(identifier)}/stat?stat=${encodeURIComponent(statKey)}`
  );
}

export async function getPlayerPointsBreakdown(identifier: string): Promise<PlayerPointsBreakdown> {
  return fetchFromApi<PlayerPointsBreakdown>(`/ca6/players/${encodeURIComponent(identifier)}/points`);
}

export async function getPlayerAchievements(
  identifier: string
): Promise<PlayerAchievementsResponse> {
  return fetchFromApi<PlayerAchievementsResponse>(
    `/ca6/players/${encodeURIComponent(identifier)}/achievements`
  );
}

export async function getPlayerAllAdvancements(
  identifier: string
): Promise<PlayerAdvancementsResponse> {
  return fetchFromApi<PlayerAdvancementsResponse>(
    `/ca6/players/${encodeURIComponent(identifier)}/advancements`
  );
}

export async function getAllAdvancements(tab?: string): Promise<AdvancementInfo[]> {
  const query = new URLSearchParams();
  if (tab) query.append("tab", tab);
  const queryString = query.toString();
  return fetchFromApi<AdvancementInfo[]>(`/advancements${queryString ? `?${queryString}` : ""}`);
}

export async function getAdvancementLeaderboard(
  advancementKey: string
): Promise<AdvancementLeaderboardEntry[]> {
  let path = `/advancements/${encodeURIComponent(advancementKey)}/leaderboard`;
  if (advancementKey.includes("/")) {
    const parts = advancementKey.split("/");
    if (parts.length === 2) {
      path = `/advancements/${parts[0]}/${parts[1]}/leaderboard`;
    }
  }
  return fetchFromApi<AdvancementLeaderboardEntry[]>(path);
}

export async function getAdvancementInfo(advancementKey: string): Promise<AdvancementInfo> {
  let path = `/advancements/${encodeURIComponent(advancementKey)}`;
  if (advancementKey.includes("/")) {
    const parts = advancementKey.split("/");
    if (parts.length === 2) {
      path = `/advancements/${parts[0]}/${parts[1]}`;
    }
  }
  return fetchFromApi<AdvancementInfo>(path);
}
