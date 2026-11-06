"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ArrowDown, ArrowUpRight, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Asset } from "../lib/types";
import { Session } from "next-auth";
import SetupWizard from "./SetupWizard";
import { useElementActive, usePageVisible, useReducedMotion } from "../lib/visibility";
import { SlotText } from "slot-text/react";
import "slot-text/style.css";

const TimelineSection = dynamic(() => import("./TimelineSection"));
const DownloadSection = dynamic(() => import("./DownloadSection"));
const GallerySection = dynamic(() => import("./GallerySection"));
const rotatingWords = ["Attack", "Team", "Capes"] as const;

const stats = [
  { label: "Teilnehmer", value: "350+" },
  { label: "Spielstunden", value: "15.000+" },
  { label: "Weltdaten", value: "320+ GB" },
  { label: "Uptime", value: "99,8 %" },
  { label: "avg Latenz", value: "< 45 ms" },
];

export default function HomeClient({ initialAssets, session }: { initialAssets: Asset[], session: Session | null }) {
  const pageVisible = usePageVisible();
  const heroRef = useRef<HTMLElement>(null);
  const heroActive = useElementActive(heroRef);
  const reducedMotion = useReducedMotion();
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const [serverStatus, setServerStatus] = useState<{ online: boolean; players: { online: number; max: number } | null; loading: boolean }>({ online: false, players: null, loading: true });
  const [copyToast, setCopyToast] = useState<{ x: number; y: number; id: number } | null>(null);

  useEffect(() => {
    if (!heroActive || reducedMotion) return;
    const interval = window.setInterval(() => setActiveWordIndex(current => (current + 1) % rotatingWords.length), 2400);
    return () => window.clearInterval(interval);
  }, [heroActive, reducedMotion]);

  useEffect(() => {
    if (!pageVisible) return;
    const controller = new AbortController();
    let fetching = false;
    const fetchStatus = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const res = await fetch("https://api.mcstatus.io/v2/status/java/play.cookieattack.de", { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
        if (!res.ok) throw new Error("Failed to fetch server status");
        const data = await res.json();
        setServerStatus({ online: !!data.online, players: data.players ? { online: data.players.online ?? 0, max: data.players.max ?? 0 } : null, loading: false });
      } catch {
        if (!controller.signal.aborted) setServerStatus({ online: false, players: null, loading: false });
      } finally { fetching = false; }
    };
    void fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [pageVisible]);

  const handleCopyIp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const { clientX: x, clientY: y } = e;
    try {
      await navigator.clipboard.writeText("play.cookieattack.de");
      setCopyToast({ x, y: y - 10, id: Date.now() });
      setTimeout(() => setCopyToast(null), 1000);
    } catch { /* The server address remains visible when clipboard access is denied. */ }
  };

  const scrollToStats = () => {
    if (statsSectionRef.current) window.scrollTo({ top: statsSectionRef.current.getBoundingClientRect().top + window.scrollY - 96 });
  };

  return (
    <div className="home-page">
      <header className="home-nav">
        <Link href="/" className="home-brand" aria-label="CookieAttack Startseite"><Image src="/minilogo.png" width={32} height={32} alt="" /><span>Cookie<span>Attack</span></span></Link>
        <nav aria-label="Hauptnavigation"><Link href="/stats">CookieStats</Link><Link href="/cookiecapes">CookieCapes</Link><Link href="/galerie">Galerie</Link></nav>
      </header>
      <section ref={heroRef} className="home-hero">
        <div className="home-hero-copy">
          <p className="section-kicker">Minecraft SMP / CookieAttack 6</p>
          <h1 className="home-wordmark"><span>Cookie</span><SlotText text={rotatingWords[activeWordIndex]} options={{ skipUnchanged: false, duration: reducedMotion ? 0 : 800, bounce: 0 }} /></h1>
          <p className="hero-description">Dein Minecraft-SMP mit Events, Roleplay und Community. Spiele mit, entdecke Spielerstatistiken oder gestalte dein eigenes Cape.</p>
          <div className="hero-actions"><Button size="lg" onClick={scrollToStats}>CookieAttack entdecken<ArrowDown data-icon="inline-end" /></Button><Button asChild variant="outline" size="lg"><a href="https://dc.cookieattack.de" target="_blank" rel="noopener noreferrer">Zum Discord<ArrowUpRight data-icon="inline-end" /></a></Button></div>
          <button onClick={handleCopyIp} className="home-server" aria-label="Serveradresse play.cookieattack.de kopieren" aria-describedby="home-server-status"><span className={serverStatus.online ? "server-dot online" : "server-dot"} /><span>play.cookieattack.de</span><span id="home-server-status" className="home-server-status">{serverStatus.loading ? "Lädt…" : serverStatus.online ? serverStatus.players ? serverStatus.players.online + " Spieler online" : "Online" : "Offline"}</span><Copy size={14} aria-hidden="true" /></button>
        </div>
        <Link href="/galerie" className="home-hero-image">
          {/* The tall crop needs enough source pixels for its height as well as its width. */}
          <Image src="/galerie/ca3-45.png" alt="Die CookieAttack Community zusammen bei Sonnenuntergang in Minecraft" fill priority sizes="(max-width: 800px) 800px, 1080px" />
          <div className="home-image-caption"><span>Aus der Community</span><strong>Unsere Welt. Unsere Geschichten.</strong><span>CookieAttack 3 <ArrowUpRight size={16} aria-hidden="true" /></span></div>
        </Link>
      </section>
      <div ref={statsSectionRef} className="home-metrics">{stats.map(stat => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
      <SetupWizard session={session} />
      <TimelineSection />

      <DownloadSection />

      <GallerySection allAssets={initialAssets} />

      <div className="relative flex w-full flex-col items-center justify-center py-32 bg-[#050505] text-center gap-8">
        <h2 className="font-nexa text-4xl md:text-6xl text-white max-w-4xl px-4 leading-tight">
          Du hast so weit gescrollt?
          <br />
          <span className="text-orange-500">Dann solltest du jetzt joinen!</span>
        </h2>
        <a
          href="https://dc.cookieattack.de"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative overflow-hidden rounded-full bg-[#5865F2] px-10 py-4 font-bold text-white transition-[color,background-color,border-color,box-shadow,transform,opacity] hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-[#5865F2]/30"
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-14.36a.074.074 0 0 0-.032-.027zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Joine den Discord!
          </span>
        </a>
      </div>

      {copyToast && (
        <div
          key={copyToast.id}
          style={{ left: copyToast.x, top: copyToast.y }}
          className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-full px-2.5 py-1 text-xs font-medium text-green-400 bg-black/90 rounded-full shadow-lg backdrop-blur-md animate-in fade-in zoom-in-90 duration-150"
        >
          Kopiert!
        </div>
      )}
    </div>
  );
}
