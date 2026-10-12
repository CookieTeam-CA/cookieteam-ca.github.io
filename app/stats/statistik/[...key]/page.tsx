import Link from "next/link";
import { notFound } from "next/navigation";
import { decodeKey, getSnapshot, statHref } from "../../lib/api";
import { Hero, Metrics, number, type Query } from "../../components/UI";
import { MinecraftIcon } from "../../components/MinecraftIcon";
import Leaderboard from "../../components/Leaderboard";
import { formatStatValue } from "../../lib/stat-units";

export async function generateMetadata({ params }: { params: Promise<{ key: string[] }> }) {
  const key = decodeKey((await params).key);
  const snapshot = await getSnapshot();
  const label = snapshot.statsById.get(key)?.display_name ?? key.split("/").at(-1)?.replace("minecraft:", "").replaceAll("_", " ") ?? "Statistik";
  return { title: label, alternates: { canonical: statHref(key) } };
}

export default async function StatPage({ params, searchParams }: { params: Promise<{ key: string[] }>; searchParams: Promise<Query> }) {
  const [route, query, data] = await Promise.all([params, searchParams, getSnapshot()]);
  const key = decodeKey(route.key);
  const info = data.statsById.get(key);
  if (!info) notFound();
  const entries = data.statBoards.get(key) ?? [];
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  return <><Link className="stats-back" href="/stats/statistiken">← Alle Statistiken</Link><div className="stats-detail-icon"><MinecraftIcon statKey={key} size={64} /></div><Hero title={info.display_name} eyebrow={`STATISTIK / ${info.category.toUpperCase()}`} description="Die höchsten Werte gewinnen. Platz 1 erhält 5 Punkte, Platz 2 erhält 3 Punkte und Platz 3 erhält 1 Punkt." /><Metrics items={[{ label: "Spieler mit positivem Wert", value: number(entries.length) }, { label: "Höchster Wert", value: formatStatValue(key, entries[0]?.value ?? 0) }, { label: "Summe", value: formatStatValue(key, total) }, { label: "Durchschnitt (aktive Spieler)", value: formatStatValue(key, entries.length ? total / entries.length : 0) }]} /><Leaderboard entries={entries} query={query} statKey={key} /></>;
}
