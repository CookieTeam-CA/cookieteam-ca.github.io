import Link from "next/link";
import { decodeKey, getStatBoard, statHref } from "../../lib/api";
import { Hero, Metrics, number, type Query } from "../../components/UI";
import { MinecraftIcon } from "../../components/MinecraftIcon";
import Leaderboard from "../../components/Leaderboard";
import { formatStatValue } from "../../lib/stat-units";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ key: string[] }>; searchParams: Promise<Query> }) {
  const key = decodeKey((await params).key);
  const data = await getStatBoard(key, await searchParams);
  const label = data.metadata.display_name;
  return { title: label, alternates: { canonical: statHref(key) } };
}

export default async function StatPage({ params, searchParams }: { params: Promise<{ key: string[] }>; searchParams: Promise<Query> }) {
  const [route, query] = await Promise.all([params, searchParams]);
  const key = decodeKey(route.key);
  const data = await getStatBoard(key, query);
  const info = data.metadata;
  const entries = data.items;
  return <><Link className="stats-back" href="/stats/statistiken">← Alle Statistiken</Link><div className="stats-detail-icon"><MinecraftIcon statKey={key} size={64} /></div><Hero title={info.display_name} eyebrow={`STATISTIK / ${info.category.toUpperCase()}`} description="Die höchsten Werte gewinnen. Platz 1 erhält 5 Punkte, Platz 2 erhält 3 Punkte und Platz 3 erhält 1 Punkt." /><Metrics items={[{ label: "Spieler mit positivem Wert", value: number(data.summary.participants) }, { label: "Höchster Wert", value: formatStatValue(key, data.summary.maximum) }, { label: "Summe", value: formatStatValue(key, data.summary.sum) }, { label: "Durchschnitt (aktive Spieler)", value: formatStatValue(key, data.summary.average) }]} /><Leaderboard entries={entries} data={data} query={query} statKey={key} /></>;
}
