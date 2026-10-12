import Link from "next/link";
import { notFound } from "next/navigation";
import { advancementHref, findPlayer, getSnapshot, playerHref, statHref } from "../../lib/api";
import { date, Hero, Metrics, number, type Query } from "../../components/UI";
import PlayerVisual from "../../components/PlayerVisual";
import Collection from "../../components/Collection";
import { nameSort, rankSort, timeSort, valueSort } from "../../lib/collections";
import { rankPoints } from "../../lib/scoring";

export async function generateMetadata({ params }: { params: Promise<{ identifier: string }> }) {
  const { identifier } = await params;
  const player = findPlayer(await getSnapshot(), identifier);
  return { title: player?.username ?? identifier, alternates: { canonical: playerHref(identifier) } };
}

export default async function PlayerPage({ params, searchParams }: { params: Promise<{ identifier: string }>; searchParams: Promise<Query> }) {
  const [route, query, data] = await Promise.all([params, searchParams, getSnapshot()]);
  const player = findPlayer(data, route.identifier);
  if (!player) notFound();
  const info = data.statsById;
  const unlocked = new Map(player.advancements.map(item => [item.achievement, item]));
  const stats = Object.entries(player.stats).filter(([, value]) => value > 0).map(([key, value]) => ({
    id: key, name: info.get(key)?.display_name ?? key, href: statHref(key), iconKey: key, statKey: key,
    category: info.get(key)?.category ?? key.split("/")[0].replace("minecraft:", ""), value,
    rank: data.statRanks.get(player.uuid)?.get(key),
  }));
  const pointBreakdown = (["stats", "advancements"] as const).map(kind => ({
    kind, label: kind === "stats" ? "Statistiken" : "Achievements",
    total: kind === "stats" ? player.statPoints : player.advancementPoints,
    placements: [1, 2, 3].map(rank => {
      const awards = player.awards.filter(award => award.kind === kind && award.rank === rank);
      return { rank, count: awards.length, perPlace: rankPoints(rank, kind === "advancements"), points: awards.reduce((sum, award) => sum + award.points, 0) };
    }),
  }));
  const achievements = data.advancements.map(item => ({
    id: item.id, name: item.display_name, href: advancementHref(item.id), iconKey: item.id,
    achievement: true, category: item.tab, description: item.description, completed: unlocked.has(item.id),
    time: unlocked.get(item.id)?.unlocked_at,
    rank: data.advancementRanks.get(player.uuid)?.get(item.id),
  }));
  const completion = data.advancements.length ? player.advancements.length / data.advancements.length * 100 : 0;
  return <>
    <Link className="stats-back" href="/stats/spieler">← Alle Spieler</Link>
    <div className={`stats-profile-hero ${player.rank <= 3 ? `podium-${player.rank}` : ""}`}><div><Hero title={player.username} eyebrow={`SPIELER / GESAMTPLATZ #${player.rank}`} description={`Zuletzt synchronisiert: ${date(player.last_sync)}`} /><div className="stats-profile-name"><PlayerVisual uuid={player.uuid} username={player.username} size={40} /><span>{player.username}</span></div></div><PlayerVisual uuid={player.uuid} username={player.username} skin interactive priority /></div>
    <Metrics items={[{ label: "Gesamtpunkte", value: number(player.points) }, { label: "Statistik-Punkte", value: number(player.statPoints) }, { label: "Achievement-Punkte", value: number(player.advancementPoints) }, { label: "Achievement-Fortschritt", value: `${number(completion)} %` }]} />
    <section className="stats-profile-progress" aria-label="Achievement-Fortschritt">
      <p>Achievement-Fortschritt <span>{number(player.advancements.length)} / {number(data.advancements.length)} abgeschlossen</span></p>
      <div className="stats-progress" role="progressbar" aria-label="Achievement-Fortschritt" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.min(completion, 100)}%` }} /></div>
    </section>
    <section className="stats-point-breakdown" aria-label="Zusammensetzung der Gesamtpunkte">
      {pointBreakdown.map(group => <div key={group.kind}>
        <h3>{group.label}<span>{number(group.total)} Punkte</span></h3>
        <ul>{group.placements.map(placement => <li key={placement.rank}>
          <span><span className={`stats-rank rank-${placement.rank}`}>{placement.rank}. Platz</span> {number(placement.count)} × {placement.perPlace} Punkte</span>
          <strong>= {number(placement.points)} Punkte</strong>
        </li>)}</ul>
      </div>)}
    </section>
    <section aria-label="Spielerstatistiken"><div className="stats-section-heading"><h2>Spielerstatistiken</h2></div>
      <Collection rows={stats} query={query} label="Statistiken" categories placeholder="In den Spielerstatistiken suchen …" defaultSort="value_desc" defaultView="list" pageSize={8}
        sortOptions={[...valueSort, ...rankSort, ...nameSort, { value: "category_asc", label: "Kategorie: A–Z" }]}
        columns={[{ key: "category", label: "Kategorie" }, { key: "value", label: "Wert" }, { key: "rank", label: "Platz" }]} />
    </section>
    <section aria-label="Spieler-Achievements"><div className="stats-section-heading"><h2>Achievements</h2><span className="stats-muted">{player.advancements.length} / {data.advancements.length} abgeschlossen</span></div>
      <Collection rows={achievements} query={query} prefix="achievements_" label="Achievements" categories categoryLabel="Tab" placeholder="In den Achievements suchen …" defaultSort="time_desc"
        sortOptions={[...timeSort, ...nameSort, ...rankSort, { value: "completed_desc", label: "Abgeschlossene zuerst" }, { value: "completed_asc", label: "Offene zuerst" }, { value: "category_asc", label: "Tab: A–Z" }]}
        columns={[{ key: "category", label: "Tab" }, { key: "completed", label: "Status" }, { key: "time", label: "Abgeschlossen am" }, { key: "rank", label: "Platz" }]} pageSize={8} />
    </section>
  </>;
}
