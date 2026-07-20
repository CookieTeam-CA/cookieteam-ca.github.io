"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Trophy } from "lucide-react";

interface StatsOverviewClientProps {
  initialStats: Array<{
    stat: string;
    id: string;
    category: string;
    leader: string;
    value: number;
  }>;
}

export default function StatsOverviewClient({ initialStats }: StatsOverviewClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(initialStats.map((s) => s.category)))].sort();

  const filteredStats = initialStats.filter((item) => {
    const matchesSearch =
      item.stat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.leader.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/30 border border-white/5 p-4 rounded-2xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Statistik oder Spieler suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-orange-500/50 transition-colors select-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end overflow-x-auto max-w-full pb-1 md:pb-0">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === category
                  ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                  : "bg-zinc-800/40 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800/80"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900/20 border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        {filteredStats.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            Keine passenden Statistiken gefunden.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-zinc-400 text-xs font-semibold uppercase tracking-widest bg-zinc-950/40">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6 w-40">Kategorie</th>
                  <th className="py-4 px-6 w-56">Führender Spieler</th>
                  <th className="py-4 px-6 text-right w-44">Rekord</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.map((item, idx) => (
                  <tr
                    key={`${item.id}-${idx}`}
                    className="border-b border-white/5 hover:bg-white/2 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <Link
                        href={`/leaderboards/stats/${item.id}`}
                        className="font-bold text-zinc-100 hover:text-orange-500 transition-colors block"
                      >
                        {item.stat}
                        <span className="text-[10px] text-zinc-600 block font-mono font-normal group-hover:text-zinc-500 transition-colors">
                          {item.id}
                        </span>
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800/50 text-zinc-400 border border-white/5">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <Link
                        href={`/player/${item.leader}`}
                        className="flex items-center gap-2 group/player"
                      >
                        <img
                          src={`https://minotar.net/avatar/${item.leader}/24`}
                          alt={item.leader}
                          className="w-6 h-6 rounded-full border border-white/10"
                          style={{ imageRendering: "pixelated" }}
                        />
                        <span className="font-bold text-zinc-200 group-hover/player:text-orange-500 transition-colors text-sm">
                          {item.leader}
                        </span>
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-white font-nexa text-base">
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{item.value.toLocaleString()}</span>
                        <Trophy size={14} className="text-yellow-500/80" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
