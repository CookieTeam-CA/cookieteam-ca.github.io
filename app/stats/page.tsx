import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOverview, statHref } from "./lib/api";
import { Hero, Metrics, number, queryText, type Query } from "./components/UI";
import Podium from "./components/Podium";
import { MinecraftIcon } from "./components/MinecraftIcon";
import HeadStack from "./components/HeadStack";
import CategoryBadge from "./components/CategoryBadge";
import { queryParams } from "./lib/collections";
import { formatStatValue } from "./lib/stat-units";

export const metadata: Metadata = { title: "Übersicht" };

export default async function OverviewPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  if (queryText(query, "search") || queryText(query, "category")) {
    const params = queryParams(query);
    redirect(`/stats/statistiken?${params}`);
  }
  const data = await getOverview();
  const playTimeKey = "minecraft:custom/minecraft:play_time";
  const totalPlayTime = data.totalPlayTime;
  const highlights = ["minecraft:custom/minecraft:play_time", "minecraft:custom/minecraft:jump", "minecraft:mined/minecraft:diamond_ore", "minecraft:custom/minecraft:mob_kills"];
  return <>
    <Hero title="CookieAttack Stats" description="Erhalte einen Überblick über CookieAttack 6 und seine Spieler. Sieh dir alle Statistiken und Erfolge der Spieler an. Messe dich mit anderen Spielern, indem du die meisten Punkte erzielst." />
    <Metrics items={[{ label: "Spieler", value: number(data.player_count) }, { label: "Statistiken", value: number(data.stat_count) }, { label: "Gesamte Spielzeit", value: formatStatValue(playTimeKey, totalPlayTime) }, { label: "Vergebene Punkte", value: number(data.total_points) }]} />
    <Podium players={data.top3} />
    <div className="stats-section-heading"><h2>Statistiken</h2><Link href="/stats/statistiken">Alle Statistiken ↗</Link></div>
    <div className="stats-grid">{highlights.map(key => {
      const info = data.highlights.find(item => item.id === key);
      if (!info) return null;
      const entries = info.top5;
      return <article className="stats-card" key={key}><Link className="stats-card-main" href={statHref(key)}><CategoryBadge category={info.category} /><div className="stats-card-title"><h3 title={info.display_name}>{info.display_name}</h3><MinecraftIcon statKey={key} /></div><p>Highscore: {formatStatValue(key, info.highest_value)}</p></Link><div className="stats-card-bottom"><HeadStack players={entries} total={info.participants} /><Link href={statHref(key)} aria-label={`${info.display_name}: Leaderboard öffnen`}>↗</Link></div></article>;
    })}</div>
  </>;
}
