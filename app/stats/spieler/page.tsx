import type { Metadata } from "next";
import { getSnapshot, playerHref } from "../lib/api";
import { Hero, type Query } from "../components/UI";
import Collection from "../components/Collection";
import { nameSort, pointSort, rankSort } from "../lib/collections";

export const metadata: Metadata = { title: "Spieler", alternates: { canonical: "/stats/spieler" } };
export default async function PlayersPage({ searchParams }: { searchParams: Promise<Query> }) {
  const [query, data] = await Promise.all([searchParams, getSnapshot()]);
  const rows = data.players.map(player => ({ id: player.uuid, name: player.username, href: playerHref(player.uuid), player,
    rank: player.rank, points: player.points, value: player.advancements.length,
    description: `${player.advancements.length} / ${data.advancements.length} Achievements`,
  }));
  return <><Hero title="Unsere Spieler" eyebrow="SPIELER / CA6" description="Die Menschen hinter den Zahlen. Entdecke ihre Statistiken, Achievements und Punkte." />
    <Collection rows={rows} query={query} label="Spieler" placeholder="Minecraft Name suchen..." defaultSort="points_desc"
      sortOptions={[...pointSort, ...nameSort, ...rankSort, { value: "value_desc", label: "Meiste Achievements" }, { value: "value_asc", label: "Wenigste Achievements" }]}
      columns={[{ key: "rank", label: "Gesamtplatz" }, { key: "points", label: "Punkte" }, { key: "value", label: "Achievements" }]} />
  </>;
}
