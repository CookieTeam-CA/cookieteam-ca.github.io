import type { PlayerData } from "./scoring";

export type StatInfo = { id: string; display_name: string; category: string };
export type AdvancementInfo = { id: string; display_name: string; description: string; tab: string };
export type Version = { snapshot_version: string; updated_at: string; scoring_version: string };
export type RawSnapshot = Version & {
  stats: StatInfo[]; advancements: AdvancementInfo[];
  players: { uuid: string; username: string; last_sync: string | null;
    stats: Record<string, number | null>;
    advancements: { achievement: string; display_name: string; unlocked_at: string }[] }[];
};

// Reproduce the old player endpoint input for the independent scoring oracle.
export function legacySnapshot(raw: RawSnapshot) {
  const catalog = new Map(raw.advancements.map(item => [item.id, item]));
  const players: PlayerData[] = raw.players.map(player => ({ ...player,
    last_sync: player.last_sync ?? undefined,
    stats: Object.fromEntries(Object.entries(player.stats).filter((entry): entry is [string, number] => entry[1] !== null)),
    advancements: player.advancements.filter(item => !item.achievement.startsWith("minecraft:recipes/"))
      .map(item => ({ ...item, description: catalog.get(item.achievement)?.description })),
  }));
  return { players, stats: raw.stats, advancements: raw.advancements.filter(item => !item.id.includes("recipes/")) };
}
