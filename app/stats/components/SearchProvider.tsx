"use client";

import { createContext, useCallback, useContext, useMemo, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ResultSkeleton } from "./Skeletons";

const SearchContext = createContext<{ pending: boolean; navigate: (url: string) => void }>({ pending: false, navigate: () => {} });
export function SearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = useCallback((url: string) => startTransition(() => router.replace(url, { scroll: false })), [router]);
  const value = useMemo(() => ({ pending, navigate }), [pending, navigate]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}
export const useStatsSearch = () => useContext(SearchContext);
export function SearchResults({ children, table = false }: { children: ReactNode; table?: boolean }) {
  const { pending } = useStatsSearch();
  return <div className="stats-search-results" aria-busy={pending}>{pending ? <><span className="sr-only" role="status">Suchergebnisse werden geladen</span><ResultSkeleton table={table} /></> : children}</div>;
}
