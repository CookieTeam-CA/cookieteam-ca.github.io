"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";

interface PlayerStatItem {
  id: string;
  display_name: string;
  category: string;
  value: number;
  rank: number | null;
}

interface PlayerStatsTableProps {
  stats: PlayerStatItem[];
}

export default function PlayerStatsTable({ stats }: PlayerStatsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", ...Array.from(new Set(stats.map((s) => s.category)))].sort();

  const filteredStats = stats.filter((s) => {
    const matchesSearch =
      s.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedStats = [...filteredStats].sort((a, b) => {
    if (a.value > 0 && b.value === 0) return -1;
    if (a.value === 0 && b.value > 0) return 1;
    if (a.value !== b.value) return b.value - a.value;
    if (a.rank && b.rank) return a.rank - b.rank;
    return a.display_name.localeCompare(b.display_name);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/30 border border-white/5 p-4 rounded-2xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Statistiken suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full md:w-auto justify-start md:justify-end overflow-x-auto max-w-full pb-1 md:pb-0">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === category
                  ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/25"
                  : "bg-zinc-800/30 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900/20 border border-white/5 rounded-2xl overflow-hidden shadow-lg">
        {sortedStats.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            Keine passenden Statistiken gefunden.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 text-zinc-400 text-xs font-semibold uppercase tracking-widest bg-zinc-950/40">
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6 w-32">Kategorie</th>
                  <th className="py-3.5 px-6 text-right w-36">Dein Wert</th>
                  <th className="py-3.5 px-6 text-center w-28">Platzierung</th>
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((s) => {
                  const isTop3 = s.rank && s.rank <= 3;
                  const medalMap = ["🥇", "🥈", "🥉"];

                  return (
                    <tr
                      key={s.id}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors group"
                    >
                      <td className="py-3.5 px-6">
                        <Link
                          href={`/leaderboards/stats/${s.id}`}
                          className="font-bold text-zinc-200 hover:text-orange-500 transition-colors flex items-center gap-1.5 group-hover:translate-x-0.5 duration-200"
                        >
                          {s.display_name}
                          <ChevronRight size={14} className="text-zinc-600 group-hover:text-orange-500 transition-colors" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="px-2 py-0.5 rounded bg-zinc-800/40 text-zinc-400 text-[11px] font-semibold border border-white/5">
                          {s.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold font-nexa text-white text-base">
                        {s.value.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {s.value === 0 ? (
                          <span className="text-zinc-600 font-mono text-xs">-</span>
                        ) : s.rank ? (
                          isTop3 ? (
                            <span className="text-xl" title={`${s.rank}. Platz`}>
                              {medalMap[s.rank - 1]}
                            </span>
                          ) : (
                            <span className="font-semibold text-zinc-400">#{s.rank}</span>
                          )
                        ) : (
                          <span className="text-zinc-500 text-xs font-semibold">#{stats.length}+</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
