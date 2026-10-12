import Link from "next/link";
import { notFound } from "next/navigation";
import { advancementHref, decodeKey, getSnapshot } from "../../lib/api";
import { date, Hero, Metrics, number, type Query } from "../../components/UI";
import { MinecraftIcon } from "../../components/MinecraftIcon";
import Leaderboard from "../../components/Leaderboard";

export async function generateMetadata({ params }: { params: Promise<{ key: string[] }> }) {
  const key = decodeKey((await params).key);
  const snapshot = await getSnapshot();
  const label = snapshot.advancementsById.get(key)?.display_name ?? key.split("/").at(-1)?.replaceAll("_", " ") ?? "Achievement";
  return { title: label, alternates: { canonical: advancementHref(key) } };
}

export default async function AchievementPage({ params, searchParams }: { params: Promise<{ key: string[] }>; searchParams: Promise<Query> }) {
  const [route, query, data] = await Promise.all([params, searchParams, getSnapshot()]);
  const key = decodeKey(route.key);
  const info = data.advancementsById.get(key);
  if (!info) notFound();
  const entries = data.advancementBoards.get(key) ?? [];
  return <><Link className="stats-back" href="/stats/achievements">← Alle Achievements</Link><div className="stats-detail-icon"><MinecraftIcon statKey={key} achievement size={64} /></div><Hero title={info.display_name} eyebrow={`ACHIEVEMENT / ${info.tab.toUpperCase()}`} description={info.description} /><p className="stats-note">Frühester Abschluss gewinnt · Platz 1: 5 Punkte · Platz 2: 3 Punkte · Platz 3: 3 Punkte</p><Metrics items={[{ label: "Abgeschlossene Spieler", value: number(entries.length) }, { label: "Erster Spieler", value: entries[0]?.username ?? "–" }, { label: "Erster Abschluss", value: <span style={{ fontSize: 15 }}>{date(entries[0]?.completed_at)}</span> }]} /><Leaderboard entries={entries} query={query} achievement /></>;
}
