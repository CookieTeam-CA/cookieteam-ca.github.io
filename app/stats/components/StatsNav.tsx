"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

const links = [["/stats", "Übersicht"], ["/stats/statistiken", "Statistiken"], ["/stats/punkte", "Punkte"], ["/stats/achievements", "Achievements"], ["/stats/spieler", "Spieler"]];
export default function StatsNav() {
  const pathname = usePathname();
  const isStatsHome = pathname === "/stats";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const renderLink = ([href, label]: string[]) => {
    const active = href === "/stats"
      ? pathname === href
      : pathname.startsWith(href) || href === "/stats/statistiken" && pathname.startsWith("/stats/statistik/");
    return <Link key={href} href={href} aria-current={active ? "page" : undefined}
      onClick={() => setMenuOpen(false)}
      className={`${active ? "text-white" : "text-zinc-400"} hover:text-white transition-colors duration-300 font-medium text-[19px]`}>
      {label}
    </Link>;
  };

  return (
    <header className="fixed top-[10px] left-1/2 -translate-x-1/2 w-[90%] max-w-[1024px] h-[55px] z-[100] select-none font-[Arial]">
      <div className="bg-[#1e1e1e]/80 backdrop-blur-[10px] border border-white/10 rounded-[18px] px-[10px] h-full flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.3)]">
        <div className="flex items-center">
          <Link href="/" aria-label="CookieAttack Startseite" onClick={() => setMenuOpen(false)}>
            <Image src="/minilogo.png" alt="CookieTeam Logo" width={32} height={32}
              className="h-8 w-auto object-contain transition-transform duration-300 hover:scale-[1.07]" />
          </Link>
          <Link href="/stats" aria-label="CookieStats Übersicht" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 pl-[10px] group">
            <span className="font-nexa text-2xl tracking-tight hidden md:block"><span className={isStatsHome ? "text-[#ff7b00]" : "text-white"}>Cookie</span><span className="text-[#ff7b00]">Stats</span></span>
          </Link>
        </div>

        <nav aria-label="Statistik-Navigation" className="hidden md:flex items-center gap-[30px]">
          {links.slice(1).map(renderLink)}
        </nav>

        <button ref={menuButton} type="button" aria-label={menuOpen ? "Navigation schließen" : "Navigation öffnen"}
          aria-expanded={menuOpen} aria-controls="stats-mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex items-center justify-center bg-white/10 hover:bg-white/15 px-[12px] py-[8px] rounded-[12px] text-zinc-300 cursor-pointer">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && <nav id="stats-mobile-navigation" aria-label="Mobile Statistik-Navigation"
        className="md:hidden absolute top-[calc(100%+10px)] left-0 right-0 flex flex-col gap-4 bg-[#1e1e1e]/95 backdrop-blur-[10px] border border-white/10 rounded-[18px] p-5 shadow-[0_2px_15px_rgba(0,0,0,0.3)]">
        {links.map(renderLink)}
      </nav>}
    </header>
  );
}
