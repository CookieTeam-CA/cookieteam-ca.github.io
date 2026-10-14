"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, LayoutGrid, List, ChevronDown } from "lucide-react";
import { useStatsSearch } from "./SearchProvider";
import type { SortOption } from "../lib/collections";

const defaultOptions = [{ value: "name_asc", label: "Name: A–Z" }, { value: "name_desc", label: "Name: Z–A" }];
type Props = {
  search: string; placeholder?: string;
  sort?: string; sortOptions?: SortOption[]; defaultSort?: string; view?: "cards" | "list";
  defaultView?: "cards" | "list"; prefix?: string; label?: string;
};
export default function Filters({ search, placeholder = "Statistik suchen ...", sort = "name_asc", sortOptions = defaultOptions, defaultSort = "name_asc", view = "cards", defaultView = "cards", prefix = "", label = "Einträge" }: Props) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate, pending } = useStatsSearch();
  const input = useRef<HTMLInputElement>(null);
  const sortSelect = useRef<HTMLSelectElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestParams = useRef(params.toString());
  useEffect(() => { latestParams.current = params.toString(); }, [params]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (input.current && document.activeElement !== input.current) input.current.value = search;
    if (sortSelect.current) sortSelect.current.value = sort;
  }, [search, sort]);

  function update(immediate = false, nextView = view) {
    clearTimeout(timer.current);
    const run = () => {
      const next = new URLSearchParams(latestParams.current);
      const set = (key: string, value: string, fallback = "") => {
        if (value && value !== fallback) next.set(`${prefix}${key}`, value); else next.delete(`${prefix}${key}`);
      };
      set("search", input.current?.value.trim() ?? "");
      set("sort", sortSelect.current?.value ?? defaultSort, defaultSort);
      set("view", nextView, defaultView);
      next.delete(`${prefix}page`);
      if (next.toString() !== latestParams.current) navigate(`${pathname}${next.size ? `?${next}` : ""}`);
    };
    if (immediate) run(); else timer.current = setTimeout(run, 250);
  }
  return <form className="stats-filters" aria-label={`${label} filtern und sortieren`} onSubmit={event => { event.preventDefault(); update(true); }}>
    <label className="stats-search"><Search size={18} aria-hidden="true" /><span className="sr-only">{label} suchen</span><input ref={input} name={`${prefix}search`} defaultValue={search} placeholder={placeholder} type="text" role="searchbox" enterKeyHint="search" onChange={() => update()} autoComplete="off" /></label>
    <label className="stats-sort-select stats-select-wrap"><span className="sr-only">{label} sortieren</span><select ref={sortSelect} name={`${prefix}sort`} defaultValue={sort} onChange={() => update(true)}>{sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></label>
    <div className="stats-view-switch" role="group" aria-label={`${label}: Ansicht`}>
      <button type="button" aria-label="Kartenansicht" title="Kartenansicht" aria-pressed={view === "cards"} onClick={() => update(true, "cards")}><LayoutGrid size={18} /></button>
      <button type="button" aria-label="Listenansicht" title="Listenansicht" aria-pressed={view === "list"} onClick={() => update(true, "list")}><List size={18} /></button>
    </div>
    <span className="sr-only" role="status">{pending ? "Suche läuft" : "Suche aktualisiert sich automatisch"}</span>
  </form>;
}
