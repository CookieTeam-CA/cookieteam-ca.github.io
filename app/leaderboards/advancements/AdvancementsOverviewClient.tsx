"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Users, Trophy } from "lucide-react";

interface AdvancementItem {
  id: string;
  display_name: string;
  description: string | null;
  tab: string;
  completedCount: number;
  firstPlayer: string | null;
}

interface AdvancementsOverviewClientProps {
  initialAdvancements: AdvancementItem[];
}

export default function AdvancementsOverviewClient({
  initialAdvancements,
}: AdvancementsOverviewClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("All");

  // Dynamically extract tabs
  const tabs = ["All", ...Array.from(new Set(initialAdvancements.map((a) => a.tab)))].sort();

  // Filter advancements
  const filteredAdvancements = initialAdvancements.filter((item) => {
    const matchesSearch =
      item.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.firstPlayer && item.firstPlayer.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab = selectedTab === "All" || item.tab === selectedTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/30 border border-white/5 p-4 rounded-2xl">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Advancements oder Spieler suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end overflow-x-auto max-w-full pb-1 md:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                selectedTab === tab
                  ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                  : "bg-zinc-800/40 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Advancements */}
      {filteredAdvancements.length === 0 ? (
        <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-12 text-center text-zinc-500">
          Keine passenden Advancements gefunden.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAdvancements.map((adv) => (
            <Link
              key={adv.id}
              href={`/leaderboards/advancements/${adv.id}`}
              className="group bg-zinc-900/20 border border-white/5 rounded-3xl p-6 hover:bg-zinc-900/30 hover:border-orange-500/30 transition-all duration-300 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-white/5 uppercase tracking-wider">
                    {adv.tab}
                  </span>
                  <div className="flex items-center gap-1 text-zinc-500 text-xs">
                    <Users size={14} />
                    <span>{adv.completedCount} Freigeschaltet</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors">
                  {adv.display_name}
                </h3>
                {adv.description && <p className="text-zinc-400 text-sm leading-relaxed">{adv.description}</p>}
                <span className="text-[10px] text-zinc-600 block font-mono leading-none pt-1 truncate">{adv.id}</span>
              </div>

              {adv.firstPlayer && (
                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1 text-xs">
                  <span className="text-zinc-500">Zuerst freigeschaltet von:</span>
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://minotar.net/avatar/${adv.firstPlayer}/20`}
                      alt={adv.firstPlayer}
                      className="w-5 h-5 rounded-full border border-white/10"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <span className="font-bold text-zinc-200 group-hover:text-orange-500 transition-colors">
                      {adv.firstPlayer}
                    </span>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
