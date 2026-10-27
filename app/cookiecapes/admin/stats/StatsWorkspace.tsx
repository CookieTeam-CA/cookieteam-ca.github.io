"use client";

import Link from "next/link";
import { createContext, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { StatsRange } from "./types";
import styles from "./stats.module.css";

export const StatsThemeContext = createContext<"dark" | "light">("dark");

export default function StatsWorkspace({ children, range, sort, error }: {
  children: ReactNode; range: StatsRange; sort: string; error?: string;
}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [density, setDensity] = useState<"compact" | "comfortable">("compact");
  const today = new Date().toISOString().slice(0, 10);
  return <StatsThemeContext.Provider value={theme}>
    <main lang="de" className={styles.workspace} data-theme={theme} data-density={density}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div>
            <nav aria-label="Brotkrumennavigation" className={styles.breadcrumb}><Link href="/cookiecapes/account">Account</Link><span aria-hidden="true">/</span><span>Administration</span></nav>
            <div className={styles.headingLine}><h1>Statistik</h1><span className={styles.badge}>CookieCapes</span></div>
            <p className={styles.intro}>Wachstum, Cape-Nutzung und API-Leistung im Überblick.</p>
          </div>
          <details className={styles.viewControl}>
            <summary>Ansicht</summary>
            <div className={styles.viewMenu}>
              <fieldset><legend>Darstellung</legend><div className={styles.segmented}>{(["dark", "light"] as const).map(value => <Button key={value} type="button" variant="ghost" aria-pressed={theme === value} onClick={() => setTheme(value)}>{value === "dark" ? "Dunkel" : "Hell"}</Button>)}</div></fieldset>
              <fieldset><legend>Informationsdichte</legend><div className={styles.segmented}>{(["compact", "comfortable"] as const).map(value => <Button key={value} type="button" variant="ghost" aria-pressed={density === value} onClick={() => setDensity(value)}>{value === "compact" ? "Kompakt" : "Komfortabel"}</Button>)}</div></fieldset>
            </div>
          </details>
        </header>
        <div className={styles.toolbar}>
          <nav aria-label="Zeitraum auswählen" className={styles.segmented}>{[7, 30, 90, 365].map(days => {
            const start = new Date(Date.parse(`${today}T00:00:00Z`) - (days - 1) * 86400000).toISOString().slice(0, 10);
            return <Link key={days} prefetch={false} href={`?${new URLSearchParams({ start, end: today, sort })}`} aria-current={range.start === start && range.end === today ? "page" : undefined}>{days === 365 ? "1 Jahr" : `${days} Tage`}</Link>;
          })}</nav>
          <form method="get" action="/cookiecapes/admin/stats" className={styles.rangeForm}>
            <div className={styles.dateFields}>
              <label>Von <span className={styles.srOnly}>(UTC)</span><input key={`start-${range.start}`} type="date" name="start" defaultValue={range.start} max={today} required /></label>
              <span aria-hidden="true">–</span>
              <label>Bis <span className={styles.srOnly}>(UTC)</span><input key={`end-${range.end}`} type="date" name="end" defaultValue={range.end} max={today} required /></label>
              <span className={styles.utc}>UTC</span>
            </div>
            <input type="hidden" name="sort" value={sort} />
            <Button type="submit" className={styles.refresh}>Aktualisieren</Button>
          </form>
        </div>
        <p className={styles.rangeHint}>1–366 UTC-Tage · einschließlich Start und Ende · ältere Historie über die Datumsauswahl · manuelle Aktualisierung</p>
        {error && <div role="alert" className={styles.error}><strong>Statistik nicht verfügbar</strong><p>{error}</p></div>}
        {children}
      </div>
    </main>
  </StatsThemeContext.Provider>;
}
