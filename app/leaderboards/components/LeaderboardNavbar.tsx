"use client";

import Link from "next/link";

export default function CookieNavbar() {
  return (
    <nav className="fixed top-2.5 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl h-13.75 z-100 transition-all duration-300 select-none">
      <div className="bg-[#1e1e1e]/80 backdrop-blur-[10px] border border-white/10 rounded-[18px] px-2.5 h-full flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.3)]">

        <div className="flex items-center">
          <a href="../"><img src="/minilogo.png" alt="CookieTeam Logo" className="h-8 w-auto object-contain transition-transform duration-300 hover:scale-[1.07]"/></a>
            <Link href="/leaderboards/points" className="flex items-center gap-3 pl-2.5 group">
              <span className="font-nexa text-[#ff7b00] text-2xl tracking-tight hidden md:block">CA6 Stats</span>
            </Link>
        </div>

        <div className="hidden md:flex items-center gap-7.5">
            <Link href="/leaderboards/points" className="text-zinc-400 hover:text-white transition-colors duration-300 font-medium text-[19px]">Punkte</Link>
            <Link href="/leaderboards/stats" className="text-zinc-400 hover:text-white transition-colors duration-300 font-medium text-[19px]">Statistiken</Link>
            <Link href="/leaderboards/advancements" className="text-zinc-400 hover:text-white transition-colors duration-300 font-medium text-[19px]">Advancements</Link>
        </div>

        <div className="flex items-center gap-3.75">
            <div id="player-count-container" className="relative group flex items-center gap-2 bg-white/10 px-3 py-2 rounded-[12px] transition-all hover:bg-white/15">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-zinc-500">
                    <path d="M1 6V15H6V11C6 9.89543 6.89543 9 8 9C9.10457 9 10 9.89543 10 11V15H15V6L8 0L1 6Z"></path>
                </svg>
                <Link href="../" id="player-count-number" className="text-sm font-medium text-zinc-300">Home</Link>
            </div>
        </div>
      </div>
    </nav>
  );
}
