"use client";

import { useTranslations } from "@/app/cookiecapes/i18n/client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, UserRound, Users } from "lucide-react";
import { fetchPlayerCountAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import StatNumber from "@/app/components/StatNumber";

interface NavbarIdentity {
  name: string;
  image?: string | null;
  minecraftUuid?: string;
}

export default function CookieNavbar({ identity = null }: { identity?: NavbarIdentity | null }) {
  const { t, number, locale } = useTranslations();
  const pathname = usePathname();
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const links = [["/cookiecapes", t("CookieCapes Startpage")], ["/cookiecapes/players", t("Players")], ["/cookiecapes/capes", "Capes"], ["/cookiecapes/rules", t("Rules")], ["/cookiecapes/tutorial", "Tutorial"]];

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); menuButton.current?.focus(); }
    };
    const desktop = matchMedia("(min-width: 1024px)");
    const resize = () => { if (desktop.matches) setMenuOpen(false); };
    window.addEventListener("keydown", close);
    desktop.addEventListener("change", resize);
    return () => { window.removeEventListener("keydown", close); desktop.removeEventListener("change", resize); };
  }, [menuOpen]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const count = await fetchPlayerCountAction();
        if (active) setTotalPlayers(count);
      } catch {
        if (active) setTotalPlayers(null);
      } finally {
        if (active) setLoaded(true);
      }
    };
    void fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  if (pathname?.startsWith("/cookiecapes/editor")) return null;

  const avatar = identity?.minecraftUuid
    ? `https://minotar.net/helm/${encodeURIComponent(identity.minecraftUuid)}/40`
    : identity?.image;
  const count = totalPlayers !== null ? number(totalPlayers) : loaded ? "–" : "…";
  const isAccount = pathname?.startsWith("/cookiecapes/account");

  return (
    <nav aria-label={t("CookieCapes navigation")} className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-7xl h-16 z-40 select-none">
      <div className="bg-[#181818]/65 backdrop-blur-xl border border-border rounded-2xl pl-4 pr-2 h-full flex items-center justify-between gap-3 shadow-[0_2px_15px_rgba(0,0,0,0.3)]">
        <div className="flex shrink-0 items-center">
          <Link href="/" aria-label={t("CookieTeam home")} className="rounded-lg focus-visible:outline-2 focus-visible:outline-orange-400">
            <Image src="/minilogo.png" alt={t("CookieTeam logo")} width={32} height={32} className="h-8 w-auto object-contain transition-transform duration-300 hover:scale-[1.07]" />
          </Link>
          <Link href="/cookiecapes" onClick={() => setMenuOpen(false)} aria-current={pathname === "/cookiecapes" ? "page" : undefined} className="flex min-h-12 items-center gap-3 pl-2.5 group rounded-lg focus-visible:outline-2 focus-visible:outline-orange-400" aria-label={t("CookieCapes Startpage")}>
            <span className="font-nexa text-base md:text-xl tracking-tight"><span className={pathname === "/cookiecapes" ? "text-primary" : "text-foreground"}>Cookie</span><span className="text-primary">Capes</span></span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          {[["/cookiecapes/players", t("Players")], ["/cookiecapes/capes", "Capes"], ["/cookiecapes/rules", t("Rules")], ["/cookiecapes/tutorial", "Tutorial"]].map(([href, label]) => (
            <Link key={href} href={href} aria-current={pathname?.startsWith(href) ? "page" : undefined} className="text-zinc-400 aria-[current=page]:text-white hover:text-white transition-colors duration-300 font-medium text-sm min-h-11 flex items-center rounded-md focus-visible:outline-2 focus-visible:outline-orange-400">{label}</Link>
          ))}
        </div>

        <div className="flex min-w-0 items-center gap-1 lg:gap-0">
        <Button asChild variant="outline" className={cn("group h-11 min-w-11 shrink gap-2.5 rounded-xl px-1.5 py-0 focus-visible:ring-orange-400/50 sm:pr-3", isAccount ? "border-orange-400/40 bg-orange-400/10 hover:bg-orange-400/15 dark:border-orange-400/40 dark:bg-orange-400/10 dark:hover:bg-orange-400/15" : "border-white/10 bg-white/3 hover:bg-white/8 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/8")}>
          <Link href="/cookiecapes/account" onClick={() => setMenuOpen(false)} aria-current={isAccount ? "page" : undefined} aria-label={identity ? t("Account of {name}, {count} registered players", { name: identity.name, count }) : t("Sign in, {count} registered players", { count })}>
            <span className={`flex size-8 shrink-0 items-center justify-center overflow-hidden bg-white/5 ring-1 ring-white/10 ${identity?.minecraftUuid || !avatar ? "rounded-lg" : "rounded-full"}`}>
              {avatar ? <Image src={avatar} alt="" width={32} height={32} unoptimized className={`size-8 object-cover ${identity?.minecraftUuid ? "[image-rendering:pixelated]" : ""}`} /> : <UserRound aria-hidden="true" className="size-4 text-orange-400" />}
            </span>
            <span className="hidden max-w-24 truncate text-sm font-medium leading-none text-zinc-100 group-hover:text-white group-aria-[current=page]:text-orange-300 sm:block">{identity?.name ?? t("Sign in")}</span>
            <span aria-hidden="true" className="hidden h-5 w-px shrink-0 bg-white/10 sm:block" />
            <span className="hidden shrink-0 items-center gap-1.5 text-xs leading-none text-zinc-400 sm:inline-flex">
              <Users aria-hidden="true" className="size-3.5 text-zinc-500" />
              {loaded ? <span className="inline-block text-right tabular-nums" style={{ minWidth: `${count.length}ch` }}>{totalPlayers !== null ? <StatNumber value={totalPlayers} locale={locale} /> : count}</span> : <Skeleton className="h-3 w-8" />}<span className="sr-only"> {t("registered players")}</span>
            </span>
          </Link>
        </Button>
        <Button ref={menuButton} type="button" variant="ghost" size="icon" className="size-11 lg:hidden"
          aria-label={t(menuOpen ? "Close navigation" : "Open navigation")} aria-expanded={menuOpen} aria-controls="cookiecapes-mobile-navigation"
          onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</Button>
        </div>
      </div>
      {menuOpen && <div id="cookiecapes-mobile-navigation" className="mt-2 flex flex-col gap-1 rounded-2xl border border-white/10 bg-zinc-900 p-3 shadow-xl lg:hidden">
        {links.map(([href, label]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)}
          aria-current={pathname === href ? "page" : undefined}
          className="flex min-h-12 items-center rounded-lg px-3 text-zinc-300 hover:bg-white/5 aria-[current=page]:text-white focus-visible:outline-2 focus-visible:outline-orange-400">{label}</Link>)}
      </div>}
    </nav>
  );
}
