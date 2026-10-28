"use client";

import { useTranslations } from "@/app/cookiecapes/i18n/client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, UserRound, Users } from "lucide-react";
import { fetchPlayerCountAction } from "../actions";
import { Button } from "@/components/ui/button";

interface NavbarIdentity {
  name: string;
  image?: string | null;
  minecraftUuid?: string;
}

export default function CookieNavbar({ identity = null }: { identity?: NavbarIdentity | null }) {
  const { t, number } = useTranslations();
  const pathname = usePathname();
  const isCookieCapesHome = pathname === "/cookiecapes";
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

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
    <nav aria-label={t("CookieCapes navigation")} className="fixed top-2.5 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl h-13.75 z-100 transition-all duration-300 select-none">
      <div className="bg-[#1e1e1e]/80 backdrop-blur-[10px] border border-white/10 rounded-[18px] px-2.5 h-full flex items-center justify-between gap-3 shadow-[0_2px_15px_rgba(0,0,0,0.3)]">
        <div className="flex shrink-0 items-center">
          <Link href="/" aria-label={t("CookieTeam home")} className="rounded-lg focus-visible:outline-2 focus-visible:outline-orange-400">
            <Image src="/minilogo.png" alt={t("CookieTeam logo")} width={32} height={32} className="h-8 w-auto object-contain transition-transform duration-300 hover:scale-[1.07]" />
          </Link>
          <Link href="/cookiecapes" className="flex items-center gap-3 pl-2.5 group rounded-lg focus-visible:outline-2 focus-visible:outline-orange-400" aria-label={t("CookieCapes home")}>
            <span className="font-nexa text-2xl tracking-tight hidden md:block"><span className={isCookieCapesHome ? "text-[#ff7b00]" : "text-white"}>Cookie</span><span className="text-[#ff7b00]">Capes</span></span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          {[["/cookiecapes/players", t("Players")], ["/cookiecapes/capes", "Capes"], ["/cookiecapes/rules", t("Rules")], ["/cookiecapes/tutorial", "Tutorial"]].map(([href, label]) => (
            <Link key={href} href={href} aria-current={pathname?.startsWith(href) ? "page" : undefined} className="text-zinc-400 aria-[current=page]:text-white hover:text-white transition-colors duration-300 font-medium text-base rounded-md focus-visible:outline-2 focus-visible:outline-orange-400">{label}</Link>
          ))}
        </div>

        <Button asChild variant="ghost" className={`group h-10 min-w-0 shrink gap-2 rounded-xl px-2 py-0 transition-colors focus-visible:ring-orange-400/50 ${isAccount ? "bg-orange-400/10 hover:bg-orange-400/15 dark:hover:bg-orange-400/15" : "hover:bg-white/5 dark:hover:bg-white/5"}`}>
          <Link href="/cookiecapes/account" aria-current={isAccount ? "page" : undefined} aria-label={identity ? t("Account of {name}, {count} registered players", { name: identity.name, count }) : t("Sign in, {count} registered players", { count })}>
            <span className={`flex size-7 shrink-0 items-center justify-center overflow-hidden bg-white/5 ring-1 ring-white/10 ${identity?.minecraftUuid || !avatar ? "rounded-md" : "rounded-full"}`}>
              {avatar ? <Image src={avatar} alt="" width={28} height={28} unoptimized className={`size-7 object-cover ${identity?.minecraftUuid ? "[image-rendering:pixelated]" : ""}`} /> : <UserRound aria-hidden="true" className="size-4 text-orange-400" />}
            </span>
            <span className="hidden max-w-24 truncate text-[13px] font-semibold leading-none text-zinc-100 group-hover:text-white sm:block">{identity?.name ?? t("Sign in")}</span>
            <span aria-hidden="true" className="h-5 w-px shrink-0 bg-white/10" />
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs leading-none text-zinc-400">
              <Users aria-hidden="true" className="size-3.5 text-zinc-500" />
              <span className="tabular-nums">{count}</span><span className="sr-only"> {t("registered players")}</span>
            </span>
            <ChevronRight aria-hidden="true" className="hidden size-3.5 text-zinc-600 group-hover:text-orange-400 lg:block" />
          </Link>
        </Button>
      </div>
    </nav>
  );
}
