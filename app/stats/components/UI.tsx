import Link from "next/link";
import type { ReactNode } from "react";
import { playerHref } from "../lib/api";
import type { Entry } from "../lib/scoring";
import PlayerVisual from "./PlayerVisual";
import { SearchResults } from "./SearchProvider";
import AnimatedNumber from "./AnimatedNumber";
import { queryParams } from "../lib/collections";
export { default as Filters } from "./Filters";

export type Query = { [key: string]: string | string[] | undefined };
export const queryText = (query: Query, key: string) => typeof query[key] === "string" ? query[key] as string : "";
export function pageNumber(query: Query, total: number, size = 50, prefix = "") {
  const number = Number(queryText(query, `${prefix}page`));
  return Math.min(Math.max(1, Math.floor(total / size) + (total % size ? 1 : 0)), Number.isSafeInteger(number) && number > 0 ? number : 1);
}
const numberFormatter = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });
const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "medium", timeZone: "Europe/Berlin" });
export const number = (value: number) => numberFormatter.format(value);
export const date = (value?: string | null) => value && Number.isFinite(Date.parse(value)) ? dateFormatter.format(new Date(value)) : "–";

export function Hero({ title, description }: { eyebrow?: string; title: string; description: string }) {
  return <div className="stats-hero"><h1>{title.startsWith("Cookie") ? <><span>Cookie</span>{title.slice(6)}</> : title}</h1><p className="stats-description">{description}</p></div>;
}
export function Rules() {
  return <details className="stats-rules"><summary>So werden Punkte vergeben</summary><p>Für jede Statistik: Platz 1 erhält 5 Punkte, Platz 2 erhält 3 Punkte und Platz 3 erhält 1 Punkt. Nur Werte größer als 0 zählen. Bei Achievements gewinnt der früheste Abschlusszeitpunkt: 5, 3 und 3 Punkte. Bei identischen Werten oder Zeiten entscheidet der alphabetische Spielername. Gesamtpunkte sind die Summe aller Platzierungen.</p></details>;
}
export function Metrics({ items }: { items: { label: string; value: ReactNode }[] }) {
  return <div className="stats-metrics">{items.map(item => <div key={item.label}><span>{item.label}</span><strong>{typeof item.value === "number" || typeof item.value === "string" && /^[-+\d.,\s%]+$/.test(item.value) ? <AnimatedNumber value={item.value} /> : item.value}</strong></div>)}</div>;
}
export function Pagination({ page, total, query, size = 50, prefix = "", totalPages }: { page: number; total: number; query: Query; size?: number; prefix?: string; totalPages?: number }) {
  const pages = Math.max(1, totalPages ?? Math.ceil(total / size));
  const href = (value: number) => { const params = queryParams(query); params.set(`${prefix}page`, String(value)); return `?${params}`; };
  return <div className="stats-pagination"><span>{number(total)} Einträge · Seite {page} von {pages}</span><div>{page > 1 && <Link className="stats-button secondary" href={href(page - 1)}>← Zurück</Link>}{page < pages && <Link className="stats-button secondary" href={href(page + 1)}>Weiter →</Link>}</div></div>;
}
export function Empty({ children = "Keine Einträge gefunden." }: { children?: ReactNode }) { return <div className="stats-empty">{children}</div>; }
export function PlayerLink({ uuid, username }: { uuid?: string; username: string }) {
  return <Link prefetch={false} className="stats-player-link" href={playerHref(uuid ?? username)}><PlayerVisual uuid={uuid} username={username} /><span>{username}</span></Link>;
}
export function Board({ entries, achievement = false, valueLabel = "Wert", showPoints = true }: { entries: Entry[]; achievement?: boolean; valueLabel?: string; showPoints?: boolean }) {
  return <SearchResults table>{!entries.length ? <Empty>Noch keine Platzierungen vorhanden.</Empty> : <div className="stats-table-wrap"><table className="stats-table"><thead><tr><th scope="col">Platz</th><th scope="col">Spieler</th><th scope="col">{achievement ? "Abgeschlossen am" : valueLabel}</th>{showPoints && <th scope="col">Punkte</th>}</tr></thead><tbody>{entries.map(entry => <tr key={entry.uuid} className={entry.rank <= 3 ? `stats-podium-row podium-${entry.rank}` : undefined}><td><span className={`stats-rank rank-${entry.rank}`}>{entry.rank.toString().padStart(2, "0")}</span></td><td><PlayerLink {...entry} /></td><td className="stats-value">{achievement ? date(entry.completed_at) : number(entry.value)}</td>{showPoints && <td><span className={entry.points ? "stats-points" : "stats-muted"}>{entry.points ? `+${entry.points}` : "–"}</span></td>}</tr>)}</tbody></table></div>}</SearchResults>;
}
