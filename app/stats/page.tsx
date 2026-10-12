import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSnapshot, statHref } from "./lib/api";
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
  const data = await getSnapshot();
  const highlights = ["minecraft:custom/minecraft:play_time", "minecraft:custom/minecraft:jump", "minecraft:mined/minecraft:diamond_ore", "minecraft:custom/minecraft:mob_kills"];
  return <>
    <Hero title="CookieStats" description="Jeder Block, jeder Erfolg, jeder Punkt. Dein Überblick über CookieAttack 6 – und die Spieler, die gerade ganz vorne stehen." />
    <Metrics items={[{ label: "Spieler", value: number(data.players.length) }, { label: "Statistiken", value: number(data.stats.length) }, { label: "Achievements", value: number(data.advancements.length) }, { label: "Vergebene Punkte", value: number(data.players.reduce((sum, player) => sum + player.points, 0)) }]} />
    <Podium players={data.players} />
    <div className="stats-section-heading"><h2>Was wurde erreicht?</h2><Link href="/stats/statistiken">Alle Statistiken ↗</Link></div>
    <div className="stats-grid">{highlights.map(key => {
      const info = data.statsById.get(key);
      if (!info) return null;
      const entries = data.statBoards.get(key) ?? [];
      return <article className="stats-card" key={key}><Link className="stats-card-main" href={statHref(key)}><CategoryBadge category={info.category} /><div className="stats-card-title"><h3 title={info.display_name}>{info.display_name}</h3><MinecraftIcon statKey={key} /></div><p>Spitzenwert: {formatStatValue(key, entries[0]?.value ?? 0)}</p></Link><div className="stats-card-bottom"><HeadStack players={entries.slice(0, 5)} total={entries.length} /><Link href={statHref(key)} aria-label={`${info.display_name}: Leaderboard öffnen`}>↗</Link></div></article>;
    })}</div>
  </>;
}
