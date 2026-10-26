"use client";

import { Button } from "@/components/ui/button";

import { useEffect, useOptimistic, useRef, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { categoryColor } from "../lib/collections";
import { useStatsSearch } from "./SearchProvider";

export default function CategoryFilters({ categories, excluded, prefix = "" }: { categories: string[]; excluded: string[]; prefix?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate } = useStatsSearch();
  const [, startTransition] = useTransition();
  const [optimisticExcluded, setOptimisticExcluded] = useOptimistic(excluded, (_current, next: string[]) => next);
  const query = params.toString();
  const latest = useRef(query);
  useEffect(() => { latest.current = query; }, [query]);

  function toggle(category: string) {
    const next = new URLSearchParams(latest.current);
    const key = `${prefix}exclude`;
    const disabled = new Set(next.getAll(key));
    if (disabled.has(category)) disabled.delete(category); else disabled.add(category);
    next.delete(key);
    for (const item of categories) if (disabled.has(item)) next.append(key, item);
    next.delete(`${prefix}page`);
    latest.current = next.toString();
    startTransition(() => {
      setOptimisticExcluded([...disabled]);
      navigate(`${pathname}${next.size ? `?${next}` : ""}`);
    });
  }

  return <div className="stats-category-filters" role="group" aria-label="Kategorien ein- oder ausschließen">
    {categories.map(category => {
      const active = !optimisticExcluded.includes(category);
      const color = categoryColor(category);
      return <Button type="button" variant="ghost" size="sm" key={category} className="stats-category-chip" aria-pressed={active}
        title={`${category} ${active ? "ausschließen" : "wieder einschließen"}`} onClick={() => toggle(category)}
        style={active ? { color, backgroundColor: `${color}18` } : undefined}>
        <span aria-hidden="true" style={active ? { backgroundColor: color } : undefined} />{category}
      </Button>;
    })}
  </div>;
}
