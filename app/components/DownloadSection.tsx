"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function DownloadSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const downloads = [
    { 
      title: "CookieAttack 3", 
      available: true, 
      url: "https://cloud.cookieattack.de/public.php/dav/files/GAw6Q6QBbr4dDb2/?accept=zip", 
      sizeZip: "30,8GB", 
      sizeUnpacked: "ca. 46GB" 
    },
    { 
      title: "CookieAttack 5", 
      available: true, 
      url: "https://cloud.cookieattack.de/public.php/dav/files/kWoxfct2p5LGTYq/?accept=zip", 
      sizeZip: "20,2GB", 
      sizeUnpacked: "ca. 25GB" 
    },
  ];

  useGSAP(() => {
    gsap.set(".download-card", { 
      y: 30, 
      opacity: 0 
    });

    gsap.to(".download-card", {
      y: 0,
      opacity: 1,
      stagger: 0.1,
      duration: 0.6,
      ease: "power3.out",
      scrollTrigger: {
        trigger: scrollRef.current,
        start: "top 85%",
        toggleActions: "play none none reverse"
      }
    });
  }, { scope: scrollRef });

  return (
    <div id="downloads" ref={scrollRef} className="w-full py-24 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center mb-16 text-center">
            <h2 className="font-nexa text-4xl md:text-5xl text-white mb-4">Weltdownloads</h2>
            <div className="h-1 w-20 bg-orange-500 rounded-full mb-6"></div>
            <p className="text-zinc-400 max-w-2xl text-lg">
                Hier kannst du die Welten der vergangenen CookieAttacks herunterladen.
            </p>
        </div>

        <div className="flex flex-col gap-4">
          {downloads.map((dl, i) => (
            <div 
              key={i} 
              className="download-card group relative p-6 rounded-2xl border border-white/5 bg-zinc-900/40 transition-all duration-300 hover:bg-zinc-800/60"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-1">
                  <h3 className="font-nexa text-2xl text-white">{dl.title}</h3>
                </div>
                
                {dl.available ? (
                    <div className="flex flex-wrap items-center gap-8">
                        <div className="flex gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">ZIP Archiv</span>
                                <span className="text-zinc-300 font-medium text-sm">{dl.sizeZip}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Entpackt</span>
                                <span className="text-zinc-300 font-medium text-sm">{dl.sizeUnpacked}</span>
                            </div>
                        </div>

                        <a 
                            href={dl.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 text-white font-bold transition-all hover:bg-orange-600 active:scale-95 whitespace-nowrap"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Download
                        </a>
                    </div>
                ) : (
                    <div className="px-6 py-2.5 rounded-xl border border-white/5 bg-white/5 text-zinc-600 font-bold opacity-50 cursor-not-allowed">
                        Nicht Verfügbar
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
