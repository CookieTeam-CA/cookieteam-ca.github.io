"use client";

import { useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChartConfiguration } from "chart.js";
import { StatsThemeContext } from "./StatsWorkspace";
import type { DailyStats } from "./types";
import css from "./stats.module.css";

type Kind = "stock" | "activity" | "requests";
type Stock = "players" | "accounts" | "capes";
const stocks: [Stock, string][] = [["players", "Spieler"], ["accounts", "Accounts"], ["capes", "Capes"]];
const integer = new Intl.NumberFormat("de-DE");
const date = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", timeZone: "UTC" });

export default function StatsCharts({ daily, kind, tableId }: { daily: DailyStats[]; kind: Kind; tableId: string }) {
  const theme = useContext(StatsThemeContext);
  const descriptionId = useId();
  const [stock, setStock] = useState<Stock>("players");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const canvas = useRef<HTMLCanvasElement>(null);
  const series = useMemo(() => {
    if (kind === "activity") return [
      { label: "Mod verbunden", color: "--stats-orange", dash: [], values: daily.map(day => day.connected_mod) },
      { label: "Minecraft authentifiziert", color: "--stats-green", dash: [6, 3], values: daily.map(day => day.authenticated_minecraft) },
      { label: "Website angemeldet", color: "--stats-blue", dash: [2, 3], values: daily.map(day => day.website_accounts) },
    ];
    if (kind === "requests") return [
      { label: "HTTP-Anfragen", color: "--stats-orange", dash: [], values: daily.map(day => day.performance.requests) },
    ];
    return [{
      label: stocks.find(([key]) => key === stock)![1], color: "--stats-orange", dash: [],
      values: daily.map(day => !day.totals ? null : stock === "players" ? day.totals.players : stock === "accounts" ? day.totals.website_accounts : day.totals.visible_capes + day.totals.hidden_capes),
    }];
  }, [daily, kind, stock]);
  const hasData = series.some(line => line.values.some(value => value !== null && (kind !== "requests" || value > 0)));
  const name = kind === "stock" ? `Bestandsentwicklung: ${series[0].label}` : kind === "activity" ? "Tägliche eindeutige Aktivität" : "HTTP-Anfragen pro Tag";

  useEffect(() => {
    const element = canvas.current;
    if (!element || !hasData) return;
    let cancelled = false;
    let destroy = () => {};
    import("chart.js").then(module => {
      if (cancelled) return;
      const context = element.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      module.Chart.register(module.LineController, module.LineElement, module.PointElement, module.BarController, module.BarElement, module.CategoryScale, module.LinearScale, module.Tooltip);
      const tokens = getComputedStyle(element);
      const color = (token: string) => tokens.getPropertyValue(token).trim();
      const config: ChartConfiguration<"line" | "bar", (number | null)[], string> = {
        type: kind === "requests" ? "bar" : "line",
        data: {
          labels: daily.map(day => date.format(new Date(`${day.day}T00:00:00Z`))),
          datasets: series.map((line, index) => ({
            label: line.label, data: line.values, borderColor: color(line.color),
            backgroundColor: color(line.color), borderWidth: 2, borderDash: line.dash,
            pointStyle: index === 1 ? "rect" : index === 2 ? "triangle" : "circle",
            pointRadius: line.values.filter(value => value !== null).length === 1 ? 3 : daily.length > 90 ? 1 : 2, pointHoverRadius: 5,
            tension: 0, spanGaps: false, maxBarThickness: 22,
          })),
        },
        options: {
          responsive: true, maintainAspectRatio: false, animation: false, locale: "de-DE",
          interaction: { mode: "index", intersect: false },
          plugins: { tooltip: {
            backgroundColor: color("--stats-panel"), titleColor: color("--stats-ink"),
            bodyColor: color("--stats-ink"), borderColor: color("--stats-border"), borderWidth: 1, padding: 12,
            callbacks: {
              title: items => {
                const day = daily[items[0]?.dataIndex];
                return day ? `${day.day} UTC${day.partial ? " · unvollständig" : ""}` : "";
              },
              label: item => `${item.dataset.label}: ${item.parsed.y == null ? "–" : integer.format(item.parsed.y)}`,
            },
          } },
          scales: {
            x: {
              grid: { display: false }, border: { color: color("--stats-border") },
              ticks: { color: color("--stats-muted"), maxTicksLimit: 6, maxRotation: 0, font: { size: 11 } },
              title: { display: true, text: "Tag (UTC)", color: color("--stats-muted"), font: { size: 11 } },
            },
            y: {
              beginAtZero: true, stacked: false, border: { display: false },
              grid: { color: color("--stats-border"), drawTicks: false },
              ticks: { color: color("--stats-muted"), maxTicksLimit: 5, precision: 0, padding: 8, font: { size: 11 } },
              title: { display: true, text: kind === "activity" ? "Eindeutige Nutzer" : series[0].label, color: color("--stats-muted"), font: { size: 11 } },
            },
          },
        },
      };
      try {
        const chart = new module.Chart(context, config);
        destroy = () => chart.destroy();
      } catch (error) {
        module.Chart.getChart(element)?.destroy();
        throw error;
      }
      setStatus("ready");
    }).catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; destroy(); };
  }, [daily, hasData, kind, series, theme]);

  const empty = kind === "stock" ? "Für diesen Zeitraum liegen noch keine Bestandsaufnahmen vor." : kind === "activity" ? "Für diesen Zeitraum wurde noch keine Aktivität erfasst." : "Für diesen Zeitraum sind noch keine HTTP-Messungen gespeichert.";
  return <div className={css.chart}>
    {kind === "stock" && <div className={css.chartToolbar}><div role="group" aria-label="Bestandsmetrik" className={css.chartControls}>{stocks.map(([key, label]) => <button key={key} type="button" aria-pressed={stock === key} onClick={() => setStock(key)}>{label}</button>)}</div><span>Ein Bestand pro Skala</span></div>}
    {hasData ? <div className={css.chartViewport} aria-busy={status === "loading"}>
      <canvas ref={canvas} role="img" aria-label={name} aria-describedby={descriptionId} aria-details={tableId} aria-hidden={status === "error" ? true : undefined}>Die exakten Werte stehen in der zugehörigen Tagestabelle.</canvas>
      {status !== "ready" && <p role="status" className={css.chartEmpty}>{status === "error" ? "Das Diagramm konnte nicht geladen werden. Die Tagestabelle bleibt verfügbar." : "Diagramm wird geladen…"}</p>}
    </div> : <p role="status" className={css.chartEmpty}>{empty}</p>}
    {kind === "activity" && <ul aria-label="Zeitreihen" className={css.chartLegend}>{series.map(line => <li key={line.label}><span aria-hidden="true" style={{ display: "inline-block", width: 16, borderTop: `2px ${line.dash.length ? "dashed" : "solid"} var(${line.color})` }} />{line.label}</li>)}</ul>}
    <div className={css.chartSummary}><span id={descriptionId}>{kind === "activity" ? "Die Gruppen überschneiden sich und dürfen nicht addiert werden." : kind === "stock" ? `${stock === "capes" ? "Sichtbare und verborgene eigene Capes. " : ""}Fehlende Bestandsaufnahmen bleiben als Lücken sichtbar.` : "Gespeicherte HTTP-Anfragen im ausgewählten Zeitraum."}</span><a className={css.chartTableLink} href={`#${tableId}`} onClick={() => document.getElementById(tableId)?.closest("details")?.setAttribute("open", "")}>Tageswerte ansehen</a></div>
  </div>;
}
