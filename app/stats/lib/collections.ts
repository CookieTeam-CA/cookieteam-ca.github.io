export type SortOption = { value: string; label: string };
type CollectionQuery = Record<string, string | string[] | undefined>;
export function queryParams(query: CollectionQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) for (const item of value) params.append(key, item);
  }
  return params;
}
export function excludedCategories(query: CollectionQuery, prefix = ""): string[] {
  const value = query[`${prefix}exclude`];
  return [...new Set((Array.isArray(value) ? value : typeof value === "string" ? [value] : []).filter(Boolean))];
}
export type CollectionRow = {
  id: string; name: string; href: string; category?: string; description?: string; iconKey?: string;
  achievement?: boolean; player?: { uuid: string; username: string }; heads?: { uuid: string; username: string }[];
  participants?: number; value?: number; statKey?: string; rank?: number | null; points?: number; time?: string | null; completed?: boolean;
  searchText?: string;
};
export const nameSort: SortOption[] = [{ value: "name_asc", label: "Name: A–Z" }, { value: "name_desc", label: "Name: Z–A" }];
export const rankSort: SortOption[] = [{ value: "rank_asc", label: "Beste Platzierung" }, { value: "rank_desc", label: "Platznummer: höchste zuerst" }];
export const pointSort: SortOption[] = [{ value: "points_desc", label: "Punkte: höchste zuerst" }, { value: "points_asc", label: "Punkte: niedrigste zuerst" }];
export const valueSort: SortOption[] = [{ value: "value_desc", label: "Wert: höchste zuerst" }, { value: "value_asc", label: "Wert: niedrigste zuerst" }];
export const timeSort: SortOption[] = [{ value: "time_asc", label: "Abschluss: früheste zuerst" }, { value: "time_desc", label: "Abschluss: neueste zuerst" }];

const collator = new Intl.Collator("de", { numeric: true });
export function sortRows(rows: CollectionRow[], sort: string): CollectionRow[] {
  const split = sort.lastIndexOf("_");
  const field = sort.slice(0, split) as keyof CollectionRow;
  const direction = sort.slice(split + 1) === "desc" ? -1 : 1;
  const get = (row: CollectionRow): string | number | undefined => {
    if (field === "time") { const time = row.time ? Date.parse(row.time) : NaN; return Number.isFinite(time) ? time : undefined; }
    if (field === "completed") return row.completed === undefined ? undefined : Number(row.completed);
    const value = row[field];
    return typeof value === "number" || typeof value === "string" ? value : undefined;
  };
  return [...rows].sort((a, b) => {
    const left = get(a), right = get(b);
    if (left === undefined && right !== undefined) return 1;
    if (left !== undefined && right === undefined) return -1;
    const result = typeof left === "number" && typeof right === "number" ? left - right : collator.compare(String(left ?? ""), String(right ?? ""));
    return result * direction || collator.compare(a.name, b.name) || a.id.localeCompare(b.id);
  });
}

const colors: Record<string, string> = {
  mining: "#60a5fa", mined: "#60a5fa", crafting: "#c084fc", crafted: "#c084fc", broken: "#fb7185",
  custom: "#fbbf24", using: "#34d399", used: "#34d399", dropped: "#fb923c", dropping: "#fb923c", pickedup: "#22d3ee", pickingup: "#22d3ee",
  killing: "#f87171", killed: "#f87171", killedby: "#e879f9", story: "#4ade80", adventure: "#fbbf24",
  nether: "#f87171", end: "#c084fc", husbandry: "#a3e635",
};
export function categoryColor(category: string): string {
  const key = category.toLowerCase().replace(/[\s_-]/g, "");
  if (colors[key]) return colors[key];
  const palette = ["#60a5fa", "#c084fc", "#34d399", "#fb7185", "#fbbf24", "#22d3ee"];
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}
