import Link from "next/link";
import { advancementHref, getProfile, playerHref, statHref } from "../../lib/api";
import { date, Hero, Metrics, number, type Query } from "../../components/UI";
import PlayerVisual from "../../components/PlayerVisual";
import Collection from "../../components/Collection";
import { nameSort, rankSort, timeSort, valueSort } from "../../lib/collections";
import { achievementPercentage, CA6_ACHIEVEMENT_TOTAL } from "../../lib/achievement-progress";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ identifier: string }>; searchParams: Promise<Query> }) {
  const { identifier } = await params;
  const player = await getProfile(identifier, await searchParams);
  return { title: player.username, alternates: { canonical: playerHref(identifier) } };
}

export default async function PlayerPage({ params, searchParams }: { params: Promise<{ identifier: string }>; searchParams: Promise<Query> }) {
  const [route, query] = await Promise.all([params, searchParams]);
  const player = await getProfile(route.identifier, query);
  const stats = player.stats.items.map(item => ({
    id: item.id, name: item.display_name, href: statHref(item.id), iconKey: item.id, statKey: item.id,
    category: item.category, value: item.value, rank: item.rank,
  }));
  const pointBreakdown = (["stats", "advancements"] as const).map(kind => ({
    kind, label: kind === "stats" ? "Statistiken" : "Achievements",
    total: kind === "stats" ? player.stat_points : player.advancement_points,
    placements: player.placements[kind].map(placement => ({ ...placement,
      perPlace: placement.count ? placement.points / placement.count : (kind === "advancements" ? [5, 3, 3] : [5, 3, 1])[placement.rank - 1],
    })),
  }));
  const achievements = player.advancements.items.map(item => ({
    id: item.id, name: item.display_name, href: advancementHref(item.id), iconKey: item.id,
    achievement: true, category: item.tab, description: item.description, completed: item.completed,
    time: item.display_unlocked_at, rank: item.rank,
  }));
  const completion = achievementPercentage(player.legacy_advancement_count);
  return <>
    <Link className="stats-back" href="/stats/spieler">← Alle Spieler</Link>
    <div className={`stats-profile-hero ${player.rank <= 3 ? `podium-${player.rank}` : ""}`}><div><Hero title={player.username} eyebrow={`PLATZIERUNG #${player.rank}`} description={`Zuletzt synchronisiert: ${date(player.last_sync)}`} /><div className="stats-profile-name"><PlayerVisual uuid={player.uuid} username={player.username} size={40} /><span>{player.username}</span></div></div><PlayerVisual uuid={player.uuid} username={player.username} skin interactive priority /></div>
    <Metrics items={[{ label: "Gesamtpunkte", value: number(player.points) }, { label: "Statistik-Punkte", value: number(player.stat_points) }, { label: "Achievement-Punkte", value: number(player.advancement_points) }, { label: "Achievement-Fortschritt", value: `${number(completion)} %` }]} />
    <section className="stats-profile-progress" aria-label="Achievement-Fortschritt">
      <p>Achievement-Fortschritt <span>{number(player.legacy_advancement_count)} / {number(CA6_ACHIEVEMENT_TOTAL)} abgeschlossen</span></p>
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
      <Collection rows={stats} data={player.stats} query={query} label="Statistiken" categories placeholder="In den Spielerstatistiken suchen ..." defaultSort="value_desc" defaultView="list"
        sortOptions={[...valueSort, ...rankSort, ...nameSort, { value: "category_asc", label: "Kategorie: A–Z" }]}
        columns={[{ key: "category", label: "Kategorie" }, { key: "value", label: "Wert" }, { key: "rank", label: "Platz" }]} />
    </section>
    <section aria-label="Spieler-Achievements"><div className="stats-section-heading"><h2>Achievements</h2><span className="stats-muted">{player.legacy_advancement_count} / {CA6_ACHIEVEMENT_TOTAL} abgeschlossen</span></div>
      <Collection rows={achievements} data={player.advancements} query={query} prefix="achievements_" label="Achievements" categories placeholder="In den Achievements suchen ..." defaultSort="time_desc"
        sortOptions={[...timeSort, ...nameSort, ...rankSort, { value: "completed_desc", label: "Abgeschlossene zuerst" }, { value: "completed_asc", label: "Offene zuerst" }, { value: "category_asc", label: "Tab: A–Z" }]}
        columns={[{ key: "category", label: "Tab" }, { key: "completed", label: "Status" }, { key: "time", label: "Abgeschlossen am" }, { key: "rank", label: "Platz" }]} />
    </section>
  </>;
}
