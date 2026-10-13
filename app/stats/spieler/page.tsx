import type { Metadata } from "next";
import { getDirectory, playerHref } from "../lib/api";
import { Hero, type Query } from "../components/UI";
import Collection from "../components/Collection";
import { nameSort, pointSort, rankSort } from "../lib/collections";
import { CA6_ACHIEVEMENT_TOTAL } from "../lib/achievement-progress";

export const metadata: Metadata = { title: "Spieler", alternates: { canonical: "/stats/spieler" } };
export default async function PlayersPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const data = await getDirectory(query);
  const rows = data.items.map(player => ({ id: player.uuid, name: player.username, href: playerHref(player.uuid), player,
    rank: player.rank, points: player.points, value: player.legacy_advancement_count,
    description: `${player.legacy_advancement_count} / ${CA6_ACHIEVEMENT_TOTAL} Achievements`,
  }));
  return <><Hero title="Unsere Spieler" eyebrow="SPIELER / CA6" description="Entdecke alle Spieler, die auf CookieAttack gespielt haben, und sieh dir ihre Stats und Erfolge an." />
    <Collection rows={rows} data={data} query={query} label="Spieler" placeholder="Minecraft Name suchen..." defaultSort="points_desc"
      sortOptions={[...pointSort, ...nameSort, ...rankSort, { value: "value_desc", label: "Meiste Achievements" }, { value: "value_asc", label: "Wenigste Achievements" }]}
      columns={[{ key: "rank", label: "Gesamtplatz" }, { key: "points", label: "Punkte" }, { key: "value", label: "Achievements" }]} />
  </>;
}
