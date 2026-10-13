import type { Entry } from "./scoring";
import type { AdvancementInfo, StatInfo, Version } from "./snapshot-adapter";
export type CollectionData<T = unknown> = {
  items: T[]; page: number; limit: number; total: number; total_pages: number; categories: string[];
};
export type PointsRow = { uuid: string; username: string; rank: number; points: number; stat_points: number; advancement_points: number };
export type StatCatalogRow = StatInfo & { participants: number; highest_value: number; top5: Entry[] };
export type AdvancementCatalogRow = AdvancementInfo & { participants: number; top5: Entry[] };
export type Overview = Version & { player_count: number; stat_count: number; visible_advancement_total: number; total_points: number; top3: PointsRow[]; highlights: StatCatalogRow[] };
export type Points = Version & CollectionData<PointsRow> & { top3: PointsRow[] };
export type StatBoard = Version & CollectionData<Entry> & { metadata: StatInfo; summary: { participants: number; sum: number; average: number; maximum: number } };
export type AdvancementBoard = Version & CollectionData<Entry> & { metadata: AdvancementInfo; summary: { participants: number; first_player: { uuid: string; username: string } | null; first_completed_at: string | null } };
export type DirectoryRow = PointsRow & { last_sync: string | null; raw_advancement_count: number; legacy_advancement_count: number; visible_advancement_total: number };
export type ProfileStat = StatInfo & { value: number; rank: number | null };
export type ProfileAdvancement = AdvancementInfo & { completed: boolean; display_unlocked_at: string | null; scoring_unlocked_at: string | null; rank: number | null };
export type Profile = Version & DirectoryRow & {
  completion_percentage: number;
  placements: Record<"stats" | "advancements", { rank: number; count: number; points: number }[]>;
  stats: CollectionData<ProfileStat>; advancements: CollectionData<ProfileAdvancement>;
};
