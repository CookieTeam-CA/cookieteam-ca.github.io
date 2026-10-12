import "server-only";
import { calculateScores, type Player, type PlayerData, type Advancement } from "./scoring";
import { createSnapshotCache } from "./snapshot-cache";

export type StatInfo = { id: string; display_name: string; category: string };
export type AdvancementInfo = { id: string; display_name: string; description: string; tab: string };
const baseUrl = process.env.STATS_API_URL ?? "http://api.cookieattack.de:8100";

class ApiResponseError extends Error {
  constructor(path: string, readonly status: number) { super(`Stats API ${path}: ${status}`); }
}

async function api<T>(path: string, signal?: AbortSignal): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        cache: "no-store",
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new ApiResponseError(path, response.status);
      return await response.json() as T;
    } catch (error) {
      if (signal?.aborted || attempt === 2 || error instanceof ApiResponseError && error.status < 500) throw error;
      // The upstream sometimes closes a reused connection; retry read-only requests.
      await new Promise(resolve => setTimeout(resolve, 150 * (attempt + 1)));
    }
  }
  throw new Error(`Stats API ${path}: request failed`);
}

async function loadSnapshot() {
  const [playerList, stats, advancements] = await Promise.all([
    api<{ players: Player[] }>("/ca6/players/"),
    api<StatInfo[]>("/stats"),
    api<AdvancementInfo[]>("/advancements"),
  ]);
  if (!Array.isArray(playerList.players) || !Array.isArray(stats) || !Array.isArray(advancements)) throw new Error("Invalid stats API response");
  const players: PlayerData[] = [];
  const controller = new AbortController();
  let next = 0;
  // Bound concurrent requests; one shared snapshot serves all statistics pages.
  await Promise.all(Array.from({ length: Math.min(6, playerList.players.length) }, async () => {
    try { while (next < playerList.players.length) {
      const player = playerList.players[next++];
      const identifier = encodeURIComponent(player.uuid);
      const [statData, advancementData] = await Promise.all([
        api<{ stats: Record<string, number>; last_sync?: string }>(`/ca6/players/${identifier}/stats`, controller.signal),
        api<{ advancements: Advancement[] }>(`/ca6/players/${identifier}/advancements`, controller.signal),
      ]);
      if (!statData.stats || !Array.isArray(advancementData.advancements)) throw new Error("Invalid player API response");
      players.push({ ...player, last_sync: statData.last_sync ?? player.last_sync, stats: statData.stats, advancements: advancementData.advancements });
    } } catch (error) { controller.abort(); throw error; }
  }));
  const scored = calculateScores(players);
  const playersByUuid = new Map(scored.players.map(player => [player.uuid, player]));
  const playersByName = new Map<string, typeof scored.players[number]>();
  for (const player of scored.players) {
    const name = player.username.toLowerCase();
    if (!playersByName.has(name)) playersByName.set(name, player);
  }
  const statRanks = new Map<string, Map<string, number>>();
  const advancementRanks = new Map<string, Map<string, number>>();
  for (const [boards, ranks] of [[scored.statBoards, statRanks], [scored.advancementBoards, advancementRanks]] as const) {
    for (const [key, entries] of boards) for (const entry of entries) {
      let playerRanks = ranks.get(entry.uuid);
      if (!playerRanks) { playerRanks = new Map(); ranks.set(entry.uuid, playerRanks); }
      playerRanks.set(key, entry.rank);
    }
  }
  const visibleAdvancements = advancements.filter(item => !item.id.includes("recipes/"));
  return { ...scored, stats, advancements: visibleAdvancements, playersByUuid, playersByName, statRanks, advancementRanks,
    statsById: new Map(stats.map(item => [item.id, item])), advancementsById: new Map(visibleAdvancements.map(item => [item.id, item])), updatedAt: new Date().toISOString() };
}

type Snapshot = Awaited<ReturnType<typeof loadSnapshot>>;
export const getSnapshot = createSnapshotCache(loadSnapshot);
export function findPlayer(data: Snapshot, identifier: string) {
  const uuidMatch = data.playersByUuid.get(identifier);
  const nameMatch = data.playersByName.get(identifier.toLowerCase());
  // Preserve the previous first-ranked match even for a username/UUID collision.
  return uuidMatch && nameMatch ? (uuidMatch.rank < nameMatch.rank ? uuidMatch : nameMatch) : uuidMatch ?? nameMatch;
}

export const keyPath = (key: string) => key.split("/").map(encodeURIComponent).join("/");
export function decodeKey(segments: string[]): string {
  try { return segments.map(segment => decodeURIComponent(segment)).join("/"); }
  catch { return ""; }
}
export const statHref = (key: string) => `/stats/statistik/${keyPath(key)}`;
export const advancementHref = (key: string) => `/stats/achievements/${keyPath(key)}`;
export const playerHref = (identifier: string) => `/stats/spieler/${encodeURIComponent(identifier)}`;
