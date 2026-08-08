"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function TimelineSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const timelineEvents = [
    { title: "CookieAttack 1", status: "VERGANGENHEIT", year: "2022" },
    { title: "CookieAttack 2", status: "VERGANGENHEIT", year: "2023" },
    { title: "CookieAttack 3", status: "VERGANGENHEIT", year: "2024" },
    { title: "CookieAttack 4", status: "VERGANGENHEIT", year: "2024" },
    { title: "CookieAttack 5", status: "VERGANGENHEIT", year: "2025" },
    { title: "CookieAttack 6", status: "AKTUELL", year: "2026" },
  ];

  useGSAP(() => {
    gsap.from(".timeline-node", {
      y: 50,
      opacity: 0,
      stagger: 0.1,
      scrollTrigger: {
        trigger: scrollRef.current,
        start: "top 80%",
      }
    });
  }, { scope: scrollRef });

  return (
    <div ref={scrollRef} className="w-full py-24 bg-[#050505] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-800 -translate-y-1/2 hidden md:block"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8 md:gap-4 relative">
            {timelineEvents.map((event, i) => (
              <div key={i} className="timeline-node flex flex-col items-center gap-4 relative z-10">
                <div className={`
                  w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-500
                  ${event.status === 'VERGANGENHEIT' ? 'bg-zinc-800 border-zinc-800' : ''}
                  ${event.status === 'AKTUELL' ? 'bg-orange-500 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)] scale-125' : ''}
                  ${event.status === 'GEPLANNT' ? 'bg-[#050505] border-zinc-700 border-dashed' : ''}
                `}>
                  {event.status === 'VERGANGENHEIT' && <div className="w-2.5 h-2.5 bg-zinc-500 rounded-full" />}
                </div>
                
                <div className="text-center">
                  <div className={`font-nexa text-lg ${event.status === 'AKTUELL' ? 'text-orange-500' : 'text-white'}`}>
                    {event.title}
                  </div>
                  <div className="text-sm text-zinc-500">{event.year}</div>
                  <div className="text-xs font-bold uppercase tracking-wider mt-1 text-zinc-600">
                    {event.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
