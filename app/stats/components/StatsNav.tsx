"use client";

import { Button } from "@/components/ui/button";

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
    <header className="fixed top-2.5 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl h-13.75 z-100 select-none font-[Arial]">
      <div className="bg-[#1e1e1e]/80 backdrop-blur-[10px] border border-white/10 rounded-[18px] px-2.5 h-full flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.3)]">
        <div className="flex items-center">
          <Link href="/" aria-label="CookieAttack Startseite" onClick={() => setMenuOpen(false)}>
            <Image src="/minilogo.png" alt="CookieTeam Logo" width={32} height={32}
              className="h-8 w-auto object-contain transition-transform duration-300 hover:scale-[1.07]" />
          </Link>
          <Link href="/stats" aria-label="CookieStats Übersicht" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 pl-2.5 group">
            <span className="font-nexa text-2xl tracking-tight hidden md:block"><span className={isStatsHome ? "text-[#ff7b00]" : "text-white"}>Cookie</span><span className="text-[#ff7b00]">Stats</span></span>
          </Link>
        </div>

        <nav aria-label="Statistik-Navigation" className="hidden md:flex items-center gap-7.5">
          {links.slice(1).map(renderLink)}
        </nav>

        <Button ref={menuButton} type="button" variant="ghost" size="icon" aria-label={menuOpen ? "Navigation schließen" : "Navigation öffnen"}
          aria-expanded={menuOpen} aria-controls="stats-mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}
          className="bg-white/10 text-zinc-300 md:hidden">
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {menuOpen && <nav id="stats-mobile-navigation" aria-label="Mobile Statistik-Navigation"
        className="md:hidden absolute top-[calc(100%+10px)] left-0 right-0 flex flex-col gap-4 bg-[#1e1e1e]/95 backdrop-blur-[10px] border border-white/10 rounded-[18px] p-5 shadow-[0_2px_15px_rgba(0,0,0,0.3)]">
        {links.map(renderLink)}
      </nav>}
    </header>
  );
}
