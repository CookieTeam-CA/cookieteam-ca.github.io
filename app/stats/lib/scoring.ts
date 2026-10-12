export type Player = { uuid: string; username: string; last_sync?: string };
export type Advancement = { achievement: string; display_name: string; description?: string; unlocked_at: string };
export type PlayerData = Player & { stats: Record<string, number>; advancements: Advancement[] };
export type Entry = { uuid: string; username: string; value: number; rank: number; points: number; completed_at?: string };
export type Award = { key: string; rank: number; points: number; kind: "stats" | "advancements" };
export type ScoredPlayer = PlayerData & { points: number; statPoints: number; advancementPoints: number; rank: number; awards: Award[] };

export function rankPoints(rank: number, achievement = false): number {
  return (achievement ? [5, 3, 3] : [5, 3, 1])[rank - 1] ?? 0;
}

// A stable username/UUID order resolves equal values and identical timestamps.
export function rankEntries(entries: Omit<Entry, "rank" | "points">[], achievement = false): Entry[] {
  return [...entries].sort((a, b) => (achievement ? a.value - b.value : b.value - a.value)
    || a.username.localeCompare(b.username, "de") || a.uuid.localeCompare(b.uuid))
    .map((entry, index) => ({ ...entry, rank: index + 1, points: rankPoints(index + 1, achievement) }));
}

export function calculateScores(players: PlayerData[]) {
  const stats = new Map<string, Omit<Entry, "rank" | "points">[]>();
  const advancements = new Map<string, Omit<Entry, "rank" | "points">[]>();
  const scored = new Map<string, ScoredPlayer>();
  for (const player of players) {
    scored.set(player.uuid, { ...player, points: 0, statPoints: 0, advancementPoints: 0, rank: 0, awards: [] });
    for (const [key, value] of Object.entries(player.stats)) {
      if (!Number.isFinite(value) || value <= 0) continue;
      const entries = stats.get(key) ?? [];
      entries.push({ uuid: player.uuid, username: player.username, value });
      stats.set(key, entries);
    }
    const seen = new Set<string>();
    for (const advancement of player.advancements) {
      const value = Date.parse(advancement.unlocked_at);
      if (!Number.isFinite(value) || seen.has(advancement.achievement) || advancement.achievement.includes("recipes/")) continue;
      seen.add(advancement.achievement);
      const entries = advancements.get(advancement.achievement) ?? [];
      entries.push({ uuid: player.uuid, username: player.username, value, completed_at: advancement.unlocked_at });
      advancements.set(advancement.achievement, entries);
    }
  }
  function score(board: Map<string, Omit<Entry, "rank" | "points">[]>, kind: Award["kind"]) {
    const result = new Map<string, Entry[]>();
    for (const [key, entries] of board) {
      const ranked = rankEntries(entries, kind === "advancements");
      result.set(key, ranked);
      for (const entry of ranked.slice(0, 3)) {
        const player = scored.get(entry.uuid)!;
        player.points += entry.points;
        if (kind === "stats") player.statPoints += entry.points;
        else player.advancementPoints += entry.points;
        player.awards.push({ key, rank: entry.rank, points: entry.points, kind });
      }
    }
    return result;
  }
  const statBoards = score(stats, "stats");
  const advancementBoards = score(advancements, "advancements");
  const ranking = [...scored.values()].sort((a, b) => b.points - a.points || a.username.localeCompare(b.username, "de") || a.uuid.localeCompare(b.uuid));
  ranking.forEach((player, index) => { player.rank = index + 1; });
  return { players: ranking, statBoards, advancementBoards };
}
