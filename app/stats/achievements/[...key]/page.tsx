import Link from "next/link";
import { advancementHref, decodeKey, getAdvancementBoard } from "../../lib/api";
import { date, Hero, Metrics, number, type Query } from "../../components/UI";
import { MinecraftIcon } from "../../components/MinecraftIcon";
import Leaderboard from "../../components/Leaderboard";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ key: string[] }>; searchParams: Promise<Query> }) {
  const key = decodeKey((await params).key);
  const data = await getAdvancementBoard(key, await searchParams);
  const label = data.metadata.display_name;
  return { title: label, alternates: { canonical: advancementHref(key) } };
}

export default async function AchievementPage({ params, searchParams }: { params: Promise<{ key: string[] }>; searchParams: Promise<Query> }) {
  const [route, query] = await Promise.all([params, searchParams]);
  const key = decodeKey(route.key);
  const data = await getAdvancementBoard(key, query);
  const info = data.metadata;
  const entries = data.items;
  return <><Link className="stats-back" href="/stats/achievements">← Alle Achievements</Link><div className="stats-detail-icon"><MinecraftIcon statKey={key} achievement size={64} /></div><Hero title={info.display_name} eyebrow={`ACHIEVEMENT / ${info.tab.toUpperCase()}`} description={info.description} /><p className="stats-note">Frühester Abschluss gewinnt · Platz 1: 5 Punkte · Platz 2: 3 Punkte · Platz 3: 3 Punkte</p><Metrics items={[{ label: "Abgeschlossene Spieler", value: number(data.summary.participants) }, { label: "Erster Spieler", value: data.summary.first_player?.username ?? "–" }, { label: "Erster Abschluss", value: <span style={{ fontSize: 15 }}>{date(data.summary.first_completed_at)}</span> }]} /><Leaderboard entries={entries} data={data} query={query} achievement /></>;
}
