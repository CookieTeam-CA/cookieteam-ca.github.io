import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminStats, StatsRange } from "./types";
import StatsCharts from "./StatsCharts";
import styles from "./stats.module.css";

const number = (value: number | null | undefined) => value == null ? "–" : value.toLocaleString("de-DE");
const latency = (value: number | null, overflow = false) => value == null ? "–" : `${overflow ? "> " : ""}${value.toLocaleString("de-DE", { maximumFractionDigits: 1 })} ms`;
const percent = (value: number) => value.toLocaleString("de-DE", { style: "percent", maximumFractionDigits: 2 });
const net = (value: number | null | undefined) => value == null ? "–" : `${value > 0 ? "+" : ""}${number(value)}`;
const timestamp = (value: string | null) => value ? new Date(value).toLocaleString("de-DE", { timeZone: "UTC" }) + " UTC" : "Noch keine Daten";

function PanelHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className={styles.panelHeading}><div><h2>{title}</h2><p>{description}</p></div>{children}</div>;
}

export default function Dashboard({ data, range, sort }: { data: AdminStats; range: StatsRange; sort: string }) {
  const o = data.overview;
  const p = data.performance;
  const routeSort = ["requests", "errors", "latency"].includes(sort) ? sort : "requests";
  const routes = [...data.routes].sort((a, b) => {
    const value = (row: typeof a) => routeSort === "errors" ? row.client_errors + row.server_errors : routeSort === "latency" ? row.average_ms ?? -1 : row.requests;
    return value(b) - value(a) || a.route.localeCompare(b.route) || a.method.localeCompare(b.method);
  });
  const stale = (value: string | null, age: number) => !value || !Number.isFinite(Date.parse(value)) || Date.parse(data.collection.generated_at) - Date.parse(value) > age;
  const delayed = stale(data.collection.snapshot_at, 10 * 60000) || stale(data.collection.http_flushed_at, 60000);
  const equipment: [string, number, string][] = [
    ["Sichtbares eigenes Cape", o.equipped_custom, "var(--stats-orange)"],
    ["Standardcape", o.equipped_default, "var(--stats-blue)"],
    ["Kein Cape", o.equipped_none, "var(--stats-muted)"],
    ["Nicht verfügbar", o.equipped_unavailable, "var(--stats-quiet)"],
  ];
  const equippedTotal = equipment.reduce((sum, [, count]) => sum + count, 0);
  const uploads = data.daily.some(day => day.uploads != null) ? data.daily.reduce((sum, day) => sum + (day.uploads ?? 0), 0) : null;
  const maxWearers = Math.max(1, ...data.top_capes.map(cape => cape.wearers));

  return <>
    <div className={`${styles.freshness} ${delayed ? styles.delayed : ""}`} role={delayed ? "status" : undefined}>
      <span className={styles.statusDot} aria-hidden="true" />
      {delayed ? "Die Sammlung ist noch nicht gestartet oder verzögert. Fehlende Werte sind keine historischen Nullen." : "Sammlung aktuell"}
      {!delayed && <span>· Ansicht: <time dateTime={data.collection.generated_at}>{timestamp(data.collection.generated_at)}</time></span>}
    </div>

    <section className={styles.overview} aria-labelledby="stats-current-heading">
      <h2 id="stats-current-heading" className={styles.srOnly}>Aktueller Überblick</h2>
      <dl className={styles.kpis}>
        {([
          ["Registrierte Spieler", o.players, `Gesperrt: ${number(o.banned_players)}`],
          ["Mod-Spieler online", o.online_mod_players, "Verifiziert · Fenster 60 Sekunden"],
          ["Website-Accounts", o.website_accounts, `Minecraft verknüpft: ${number(o.linked_minecraft_accounts)}`],
          ["Sichtbare eigene Capes", o.visible_capes, `Verborgen: ${number(o.hidden_capes)}`],
        ] as const).map(([label, count, detail]) => <div key={label} className={`${styles.panel} ${styles.kpi}`}>
          <dt>{label}<span className={styles.badge}>Aktuell</span></dt><dd className={styles.kpiValue}>{number(count)}</dd><dd className={styles.kpiFoot}>{detail}</dd>
        </div>)}
      </dl>
    </section>

    <div className={styles.charts}>
      <section className={styles.panel}>
        <PanelHeading title="Bestandsentwicklung" description="Letzter erfasster Bestand pro UTC-Tag" />
        <StatsCharts daily={data.daily} kind="stock" tableId="stats-daily-values" />
      </section>
      <section className={styles.panel}>
        <PanelHeading title="Tägliche Aktivität" description="Eindeutige Nutzer pro Tag · drei getrennte Gruppen" />
        <StatsCharts daily={data.daily} kind="activity" tableId="stats-daily-values" />
      </section>
    </div>

    <div className={styles.secondary}>
      <section className={styles.panel}>
        <PanelHeading title="Ausgerüstete Capes" description="Nicht gesperrte Spieler · aktueller Stand" />
        <dl className={styles.kv}>{equipment.map(([label, count]) => <div key={label}><dt>{label}</dt><dd>{number(count)}</dd></div>)}</dl>
        <div className={styles.usageTrack} aria-hidden="true">{equipment.map(([label, count, color]) => <span key={label} style={{ width: `${equippedTotal ? count / equippedTotal * 100 : 0}%`, backgroundColor: color }} />)}</div>
        <p className={styles.sectionFoot}>Ausgerüstet bedeutet nicht online. Nicht verfügbar: verborgene oder gelöschte Cape-ID.</p>
      </section>
      <section className={styles.panel}>
        <PanelHeading title="Verifizierung & Moderation" description="Gespeicherte Bestände" />
        <dl className={styles.kv}>{([
          ["Website-verifizierte Capes", o.verification_website],
          ["Minecraft-verifizierte Capes", o.verification_minecraft_session],
          ["Unverifizierte Capes", o.verification_unverified],
          ["Verknüpfte Minecraft-Accounts", o.linked_minecraft_accounts],
          ["Gesperrte Spieler", o.banned_players], ["Gespeicherte Meldungen", o.reports],
        ] as const).map(([label, count]) => <div key={label}><dt>{label}</dt><dd>{number(count)}</dd></div>)}</dl>
      </section>
      <section className={`${styles.panel} ${styles.apiPanel}`}>
        <PanelHeading title="API-Leistung" description="HTTP-Anfragen im gewählten Zeitraum"><span className={styles.badge}>Zeitraum</span></PanelHeading>
        <dl className={styles.apiGrid}>
          <div><dt>Anfragen</dt><dd>{number(p.requests)}</dd></div>
          <div><dt>4xx-Rate</dt><dd>{percent(p.client_error_rate)}<small>{number(p.client_errors)} Fehler</small></dd></div>
          <div><dt>5xx-Rate</dt><dd>{percent(p.server_error_rate)}<small>{number(p.server_errors)} Fehler</small></dd></div>
          <div><dt>Ø Laufzeit</dt><dd>{latency(p.average_ms)}</dd></div>
          <div><dt>p95 ≈</dt><dd>{latency(p.p95_ms, p.p95_overflow)}</dd></div>
          <div><dt>Uploads erfasst</dt><dd>{number(uploads)}</dd></div>
        </dl>
        <p className={styles.sectionFoot}>p95 ist eine Näherung · ohne CDN-Traffic · Uploads ab Erfassungsbeginn</p>
      </section>
    </div>

    <div className={styles.tables}>
      <section className={styles.panel}>
        <PanelHeading title="Beliebteste Capes" description="Top 10 nach nicht gesperrten Trägern"><span className={styles.badge}>Aktuell</span></PanelHeading>
        {data.top_capes.length ? <div className={styles.tableScroll}><table className={styles.table}>
          <caption>Ausgerüstete sichtbare eigene Capes</caption>
          <thead><tr><th scope="col">Cape</th><th scope="col">Träger</th></tr></thead>
          <tbody>{data.top_capes.map(cape => <tr key={cape.cape_id}>
            <th scope="row"><span className={styles.capeName}><Link prefetch={false} href={`/cookiecapes/capes/${cape.cape_id}`}>{cape.cape_name ?? `Cape ${cape.cape_id}`}</Link><span className={styles.capeId}>#{cape.cape_id}</span></span></th>
            <td>{number(cape.wearers)}<span className={styles.wearerBar} aria-hidden="true"><span style={{ width: `${cape.wearers / maxWearers * 100}%` }} /></span></td>
          </tr>)}</tbody>
        </table></div> : <p className={styles.empty}>Noch keine ausgerüsteten sichtbaren eigenen Capes.</p>}
      </section>
      <section className={`${styles.panel} ${styles.routesPanel}`}>
        <PanelHeading title="HTTP-Routen" description="Nutzung und Antwortzeiten im gewählten Zeitraum" />
        <StatsCharts daily={data.daily} kind="requests" tableId="stats-http-values" />
        <nav aria-label="Routen sortieren" className={styles.routeSort}>{[["requests", "Anfragen"], ["errors", "Fehler"], ["latency", "Laufzeit"]].map(([key, label]) => <Link key={key} prefetch={false} href={`?${new URLSearchParams({ ...range, sort: key })}`} aria-current={routeSort === key ? "page" : undefined}>{label}{routeSort === key ? " ↓" : ""}</Link>)}</nav>
        {routes.length ? <div className={styles.tableScroll}><table className={styles.table}>
          <caption>HTTP-Routen, absteigend nach {routeSort === "errors" ? "4xx + 5xx" : routeSort === "latency" ? "Durchschnittslatenz" : "Anfragen"}</caption>
          <thead><tr>{["Route", "Anfragen", "Fehler", "4xx", "5xx", "Ø Laufzeit", "p95 ≈"].map((label, index) => <th key={label} scope="col" aria-sort={index === ({ requests: 1, errors: 2, latency: 5 }[routeSort]) ? "descending" : undefined}>{label}</th>)}</tr></thead>
          <tbody>{routes.map(route => <tr key={`${route.method}:${route.route}`}>
            <th scope="row" className={styles.routeName}><span className={styles.method}>{route.method}</span>{route.route}</th>
            <td>{number(route.requests)}</td><td>{number(route.client_errors + route.server_errors)}</td>
            <td>{number(route.client_errors)} ({percent(route.client_error_rate)})</td><td>{number(route.server_errors)} ({percent(route.server_error_rate)})</td>
            <td>{latency(route.average_ms)}</td><td>{latency(route.p95_ms, route.p95_overflow)}</td>
          </tr>)}</tbody>
        </table></div> : <p className={styles.empty}>Für diesen Zeitraum sind noch keine HTTP-Messungen gespeichert.</p>}
      </section>
    </div>

    <div className={styles.detailsStack}>
      <details id="stats-daily-values">
        <summary><span>Tageswerte im Detail <small>· Bestände, Nettoänderungen, Aktivität & Uploads</small></span></summary>
        <div className={styles.detailsBody}><div className={styles.tableScroll}><table className={styles.table}>
          <caption>Tageswerte und Aktivität – {range.start} bis {range.end} (UTC); – bedeutet keine Daten</caption>
          <thead><tr>{["Tag (UTC)", "Spieler", "Δ Spieler", "Accounts", "Δ Accounts", "Capes", "Δ Capes", "Uploads", "Mod verbunden", "Minecraft authentifiziert", "Website angemeldet"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{data.daily.map(day => <tr key={day.day}>
            <th scope="row">{day.day}{day.partial && <span className={styles.partial}>(unvollständig)</span>}</th>
            <td>{number(day.totals?.players)}</td><td>{net(day.net?.players)}</td><td>{number(day.totals?.website_accounts)}</td><td>{net(day.net?.website_accounts)}</td>
            <td>{day.totals ? number(day.totals.visible_capes + day.totals.hidden_capes) : "–"}</td><td>{net(day.net?.capes)}</td>
            <td>{number(day.uploads)}</td><td>{number(day.connected_mod)}</td><td>{number(day.authenticated_minecraft)}</td><td>{number(day.website_accounts)}</td>
          </tr>)}</tbody>
        </table></div></div>
      </details>
      <details id="stats-http-values">
        <summary><span>HTTP-Tageswerte <small>· Anfragen, Fehlerquoten und Latenzen</small></span></summary>
        <div className={styles.detailsBody}><div className={styles.tableScroll}><table className={styles.table}>
          <caption>HTTP-Leistung pro UTC-Tag</caption>
          <thead><tr>{["Tag", "Anfragen", "4xx-Rate", "5xx-Rate", "Ø Laufzeit", "p95 ≈"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{data.daily.map(day => <tr key={day.day}>
            <th scope="row">{day.day}{day.partial && <span className={styles.partial}>(unvollständig)</span>}</th>
            <td>{number(day.performance.requests)}</td><td>{percent(day.performance.client_error_rate)}</td><td>{percent(day.performance.server_error_rate)}</td>
            <td>{latency(day.performance.average_ms)}</td><td>{latency(day.performance.p95_ms, day.performance.p95_overflow)}</td>
          </tr>)}</tbody>
        </table></div></div>
      </details>
      <details>
        <summary>Definitionen & Datenerfassung</summary>
        <div className={`${styles.detailsBody} ${styles.definitions}`}>
          <div><p><strong>Aktuell oder Zeitraum?</strong>Die Übersicht und Cape-Rangliste beschreiben den aktuellen Datenbestand. Diagramme, Aktivität, Uploads und API-Leistung beziehen sich auf den gewählten Zeitraum. Cape-Zahlen schließen das Standardcape aus.</p><p><strong>Online und ausgerüstet</strong>Online bedeutet eindeutige verifizierte Mod-Präsenz mit Erneuerung innerhalb von 60 Sekunden. Ausgerüstete Capes zählen nicht gesperrte Spieler, unabhängig von ihrer Präsenz. Verifizierung bestätigt die Identität des Eigentümers, nicht die Urheberschaft.</p></div>
          <div><p><strong>Drei Aktivitätsgruppen</strong>Mod: Verbindung oder Präsenz-Erneuerung. Minecraft: erfolgreiche Sitzungsprüfung. Website: gültige Anmeldesitzung. Die drei Gruppen überschneiden sich und dürfen nicht addiert werden.</p><p><strong>Historie und Lücken</strong>Erfassung ab Sammlungsbeginn; keine erfundene Historie. Der erste und laufende UTC-Tag sind unvollständig. Nettoänderungen vergleichen nur aufeinanderfolgende erfasste Tage. Tagesaggregate bleiben dauerhaft erhalten.</p><p>Nullwerte nach Sammlungsbeginn bedeuten keine aufgezeichneten Ereignisse; sie belegen keinen lückenlosen Betrieb. Bei Ausfällen können Aktivitätsmessungen fehlen. Erfolgreiche Uploads bleiben auch nach späterer Cape-Löschung gezählt.</p></div>
          <div><p><strong>Laufzeit und p95</strong>Messung bis zum Abschluss der HTTP-Antwort. Der Durchschnitt ist nach Anfragen gewichtet. p95 ist die obere Grenze des Histogramm-Buckets: 10/25/50/100/250/500/1000/2500/5000 ms. Über 5000 ms ist nur eine Untergrenze bekannt.</p><p><strong>Grenzen der Sammlung</strong>WebSocket-Laufzeiten und direkt vom CDN beantwortete Anfragen fehlen. Speicherung ungefähr alle 15 Sekunden; erzwungenes Beenden kann ungespeicherte Messungen verlieren. Aktualität zeigt erfolgreiche Erfassung, keine garantierte Vollständigkeit aller Worker.</p></div>
        </div>
      </details>
    </div>
    <footer className={styles.collectionBar}>
      <div className={styles.collectionMeta}><span>Sammlung seit: {timestamp(data.collection.started_at)}</span><span>Bestandsaufnahme: {timestamp(data.collection.snapshot_at)}</span><span>HTTP-Speicherung: {timestamp(data.collection.http_flushed_at)}</span></div>
      <span>Ansicht: {timestamp(data.collection.generated_at)} · manuelle Aktualisierung</span>
    </footer>
  </>;
}
