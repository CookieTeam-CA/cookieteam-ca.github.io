import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createPreparedClient, StatsApiError, versionedSequence } from "./prepared-cache";
import { collectionQuery, profileQuery, sorts } from "./prepared-query";
import type { AdvancementBoard, AdvancementCatalogRow, CollectionData, DirectoryRow, Overview, Points, Profile, StatBoard, StatCatalogRow } from "./prepared-types";
import type { Version } from "./snapshot-adapter";
import type { Query } from "../components/UI";

const ttl = Number(process.env.STATS_API_TTL ?? process.env.STATS_SNAPSHOT_TTL ?? 300);
if (!Number.isFinite(ttl) || ttl <= 0 || ttl > 300) throw new Error("Stats API TTL must be in (0, 300] seconds");
const client = createPreparedClient(process.env.STATS_API_URL ?? "https://capi.cookieattack.de", ttl * 1000);
// Primitive arguments let React deduplicate metadata and page reads per render,
// even when callers created separate URLSearchParams or Query objects.
const request = cache(async (resource: string, query: string) => {
  try { return await client.get(resource, new URLSearchParams(query)); }
  catch (error) { if (error instanceof StatsApiError && error.status === 404) notFound(); throw error; }
});
export async function getPoints(query: Query) { return await request("/ca6/leaderboards/points", collectionQuery(query, sorts.points, "rank_asc", "", "", 12).toString()) as Points; }
export async function getStats(query: Query) { return await request("/ca6/stats", collectionQuery(query, sorts.stats, "name_asc", "", "", 12).toString()) as Version & CollectionData<StatCatalogRow>; }
export async function getAdvancements(query: Query) { return await request("/ca6/advancements", collectionQuery(query, sorts.advancements, "name_asc", "", "", 12).toString()) as Version & CollectionData<AdvancementCatalogRow>; }
export async function getDirectory(query: Query) {
  return await request("/ca6/players/directory", collectionQuery(query, sorts.directory, "points_desc", "", "", 12).toString()) as Version & CollectionData<DirectoryRow>;
}
export async function getProfile(identifier: string, query: Query) {
  return await request(`/ca6/players/${encodeURIComponent(identifier)}/profile`, profileQuery(query).toString()) as Profile;
}
export async function getStatBoard(key: string, query: Query) {
  const params = collectionQuery(query, sorts.statBoard, "rank_asc"); params.set("key", key);
  return await request("/ca6/leaderboards/stats", params.toString()) as StatBoard;
}
export async function getAdvancementBoard(key: string, query: Query) {
  const params = collectionQuery(query, sorts.advancementBoard, "rank_asc"); params.set("key", key);
  return await request("/ca6/leaderboards/advancements", params.toString()) as AdvancementBoard;
}
export const getOverview = cache(async () => versionedSequence(async force => {
  const overview = await client.get<Overview>("/ca6/overview", undefined, force);
  const key = "minecraft:custom/minecraft:play_time";
  // Overview lacks the complete playtime sum. Read only its pinned summary.
  const playtime = overview.highlights.some(item => item.id === key)
    ? await client.get<StatBoard>("/ca6/leaderboards/stats", new URLSearchParams({ key, limit: "1", snapshot_version: overview.snapshot_version }), force)
    : undefined;
  return { ...overview, totalPlayTime: playtime?.summary.sum ?? 0 };
}));

export const keyPath = (key: string) => key.split("/").map(encodeURIComponent).join("/");
export function decodeKey(segments: string[]): string {
  try { return segments.map(segment => decodeURIComponent(segment)).join("/"); }
  catch { return ""; }
}
export const statHref = (key: string) => `/stats/statistik/${keyPath(key)}`;
export const advancementHref = (key: string) => `/stats/achievements/${keyPath(key)}`;
export const playerHref = (identifier: string) => `/stats/spieler/${encodeURIComponent(identifier)}`;
