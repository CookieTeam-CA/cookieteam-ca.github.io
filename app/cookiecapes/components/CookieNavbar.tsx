"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchStatsAction, fetchPlayerCountAction } from "../actions";
import { StatsResponse } from "../lib/api";

export default function CookieNavbar() {
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);
  const [onlineStats, setOnlineStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        const count = await fetchPlayerCountAction();
        setTotalPlayers(count);

        const stats = await fetchStatsAction();
        setOnlineStats(stats);
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed top-[10px] left-1/2 -translate-x-1/2 w-[90%] max-w-[1024px] h-[55px] z-[100] transition-all duration-300">
      <div className="bg-[#1e1e1e]/80 backdrop-blur-[10px] border border-white/10 rounded-[18px] px-[10px] h-full flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.3)]">

        <div className="flex items-center">
          <a href="../"><img src="/minilogo.png" alt="CookieTeam Logo" className="h-8 w-auto object-contain transition-transform duration-300 hover:scale-[1.07]"/></a>
            <Link href="/cookiecapes" className="flex items-center gap-3 pl-[10px] group">
              <span className="font-nexa text-[#ff7b00] text-2xl tracking-tight hidden md:block">CookieCapes</span>
            </Link>
        </div>

        <div className="hidden md:flex items-center gap-[30px]">
            <Link href="/cookiecapes/players" className="text-zinc-400 hover:text-white transition-colors duration-300 font-medium text-[19px]">Player</Link>
            <Link href="/cookiecapes/capes" className="text-zinc-400 hover:text-white transition-colors duration-300 font-medium text-[19px]">Capes</Link>
            <Link href="/cookiecapes/rules" className="text-zinc-400 hover:text-white transition-colors duration-300 font-medium text-[19px]">Regeln</Link>
            <Link href="/cookiecapes/tutorial" className="text-zinc-400 hover:text-white transition-colors duration-300 font-medium text-[19px]">Tutorial</Link>
        </div>

        <div className="flex items-center gap-[15px]">
            <div id="player-count-container" className="relative group cursor-help flex items-center gap-2 bg-white/10 px-[12px] py-[8px] rounded-[12px] transition-all hover:bg-white/15">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-500">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                </svg>
                <span id="player-count-number" className="text-sm font-medium text-zinc-300">
                    {totalPlayers ? totalPlayers.toLocaleString() : "..."}
                </span>

                <div id="player-count-tooltip" className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 min-w-[190px] p-[12px_18px] flex flex-col gap-2 bg-[#0c0c0c] border border-white/10 rounded-[10px] shadow-[0_4px_15px_rgba(0,0,0,0.3)] opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:top-[calc(100%+12px)] transition-all duration-300 z-10">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-x-[6px] border-b-[6px] border-x-transparent border-b-[#0c0c0c]" />
                    
                    <div className="flex items-center gap-[10px] text-zinc-400 text-sm font-medium">
                        <svg className="w-[18px] h-[18px] text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        <span>Registrierte Spieler: {totalPlayers !== null ? totalPlayers.toLocaleString() : "..."}</span>
                    </div>

                    <div className="flex items-center gap-[10px] text-[#4ade80] text-sm font-medium">
                        <svg className="w-[18px] h-[18px] fill-[#4ade80]" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                        </svg>
                        <span>Aktive Spieler: {onlineStats ? onlineStats.online_player_count : "..."}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </nav>
  );
}
