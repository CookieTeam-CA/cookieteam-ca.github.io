import type { Metadata } from "next";
import { getSnapshot } from "../lib/api";
import { Hero, type Query } from "../components/UI";
import Podium from "../components/Podium";
import Leaderboard from "../components/Leaderboard";

export const metadata: Metadata = { title: "Punkte", alternates: { canonical: "/stats/punkte" } };
export default async function PointsPage({ searchParams }: { searchParams: Promise<Query> }) {
  const [query, data] = await Promise.all([searchParams, getSnapshot()]);
  const entries = data.players.map(player => ({ uuid: player.uuid, username: player.username, rank: player.rank, value: player.points, points: 0 }));
  return <><Hero title="Punkte" eyebrow="GESAMTWERTUNG / CA6" description="Alle Statistik- und Achievement-Punkte zusammen. Jede Platzierung auf dem Podest zählt." /><Podium players={data.players} /><div className="stats-section-heading"><h2>Alle Platzierungen</h2></div>
    <Leaderboard entries={entries} query={query} valueLabel="Gesamtpunkte" showPoints={false} />
  </>;
}
