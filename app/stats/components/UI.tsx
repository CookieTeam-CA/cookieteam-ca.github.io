import Link from "next/link";
import type { ReactNode } from "react";
import AnimatedNumber from "./AnimatedNumber";
import { queryParams } from "../lib/collections";
export { default as Filters } from "./Filters";

export type Query = { [key: string]: string | string[] | undefined };
export const queryText = (query: Query, key: string) => typeof query[key] === "string" ? query[key] as string : "";
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
