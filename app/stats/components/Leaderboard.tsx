import type { CollectionData } from "../lib/prepared-types";
import type { Entry } from "../lib/scoring";
import { playerHref } from "../lib/api";
import { nameSort, rankSort, pointSort, timeSort, valueSort } from "../lib/collections";
import Collection from "./Collection";
import type { Query } from "./UI";

export default function Leaderboard({ entries, data, query, achievement = false, showPoints = true, valueLabel = "Wert", statKey }: { entries: Entry[]; data: CollectionData; query: Query; achievement?: boolean; showPoints?: boolean; valueLabel?: string; statKey?: string }) {
  const rows = entries.map(entry => ({ id: entry.uuid, name: entry.username, href: playerHref(entry.uuid), player: entry,
    rank: entry.rank, points: entry.points, value: entry.value, time: entry.completed_at, statKey,
  }));
  return <Collection rows={rows} data={data} query={query} label="Spieler" placeholder="Spieler suchen …" defaultView="list" defaultSort="rank_asc"
    sortOptions={[...rankSort, ...nameSort, ...pointSort, ...(achievement ? timeSort : valueSort.map(option => ({ ...option, label: option.label.replace("Wert", valueLabel) })))]}
    columns={[{ key: "rank", label: "Platz" }, achievement ? { key: "time", label: "Abgeschlossen am" } : { key: "value", label: valueLabel }, ...(showPoints ? [{ key: "points" as const, label: "Punkte" }] : [])]} />;
}
