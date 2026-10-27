export interface Overview {
  players: number;
  banned_players: number;
  online_mod_players: number;
  website_accounts: number;
  linked_minecraft_accounts: number;
  visible_capes: number;
  hidden_capes: number;
  verification_unverified: number;
  verification_website: number;
  verification_minecraft_session: number;
  reports: number;
  equipped_custom: number;
  equipped_default: number;
  equipped_none: number;
  equipped_unavailable: number;
}

export interface Performance {
  requests: number;
  client_errors: number;
  server_errors: number;
  client_error_rate: number;
  server_error_rate: number;
  average_ms: number | null;
  p95_ms: number | null;
  p95_overflow: boolean;
}

export interface DailyStats {
  day: string;
  partial: boolean;
  snapshot_at: string | null;
  totals: Overview | null;
  net: { players: number; website_accounts: number; capes: number } | null;
  uploads: number | null;
  connected_mod: number | null;
  authenticated_minecraft: number | null;
  website_accounts: number | null;
  performance: Performance;
}

export interface AdminStats {
  collection: {
    started_at: string | null;
    snapshot_at: string | null;
    http_flushed_at: string | null;
    generated_at: string;
  };
  start: string;
  end: string;
  overview: Overview;
  daily: DailyStats[];
  top_capes: { cape_id: number; cape_name: string | null; wearers: number }[];
  performance: Performance;
  routes: (Performance & { method: string; route: string })[];
}

export type StatsSearch = Record<string, string | string[] | undefined>;
export type StatsRange = { start: string; end: string };

export function statsRange(params: StatsSearch, now = new Date()): StatsRange {
  const today = now.toISOString().slice(0, 10);
  const end = params.end ?? today;
  const start = params.start ?? new Date(Date.parse(`${today}T00:00:00Z`) - 29 * 86400000).toISOString().slice(0, 10);
  if (typeof start !== "string" || typeof end !== "string") throw new Error("Bitte jedes Datum genau einmal angeben.");
  for (const value of [start, end]) {
    if (typeof value !== "string" || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)
      || !Number.isFinite(Date.parse(`${value}T00:00:00Z`))
      || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
      throw new Error("Bitte gültige UTC-Daten im Format JJJJ-MM-TT wählen.");
    }
  }
  if (start > end || end > today || Date.parse(end) - Date.parse(start) > 365 * 86400000) {
    throw new Error("Bitte einen Zeitraum von 1 bis 366 Tagen wählen, der spätestens heute endet.");
  }
  return { start, end };
}
