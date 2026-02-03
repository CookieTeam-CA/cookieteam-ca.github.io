"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

export default function CapeHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleStartRef = useRef<HTMLSpanElement>(null);
  const titleEndRef = useRef<HTMLSpanElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    const startChars = titleStartRef.current?.children;
    const endChars = titleEndRef.current?.children;
    
    // Initial state
    if (startChars && endChars) {
        gsap.set([...Array.from(startChars), ...Array.from(endChars)], { y: 100, autoAlpha: 0 });
    }
    gsap.set(tagsRef.current?.children || [], { y: 20, autoAlpha: 0 });
    gsap.set(descriptionRef.current, { y: 20, autoAlpha: 0 });
    gsap.set(buttonsRef.current, { y: 20, autoAlpha: 0 });

    tl.to([...Array.from(startChars || []), ...Array.from(endChars || [])], {
        y: 0,
        autoAlpha: 1,
        stagger: 0.05,
        duration: 1,
        ease: "back.out(1.7)",
        delay: 0.2
    })
    .to(tagsRef.current?.children || [], {
      y: 0,
      autoAlpha: 1,
      stagger: 0.1,
      duration: 0.8,
      ease: "back.out(1.7)"
    }, "-=0.4")
    .to(descriptionRef.current, {
        y: 0,
        autoAlpha: 1,
        duration: 0.8,
    }, "-=0.4")
    .to(buttonsRef.current, {
        y: 0,
        autoAlpha: 1,
        duration: 0.8,
        ease: "power3.out"
    }, "-=0.4");

  }, { scope: containerRef });

  const splitText = (text: string) => {
    return text.split("").map((char, index) => (
      <span key={index} className="inline-block">{char}</span>
    ));
  };

  const scrollToSetup = () => {
    gsap.to(window, { duration: 1, scrollTo: "#setup-wizard", ease: "power3.inOut" });
  };

  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center py-20 md:py-32 gap-8 text-center px-4">
      <div className="absolute top-0 left-0 w-full h-full bg-orange-500/5 blur-[100px] -z-10 pointer-events-none rounded-full" />
      
      <h1 className="font-nexa text-6xl md:text-8xl lg:text-9xl tracking-tighter drop-shadow-lg overflow-hidden leading-tight">
        <span ref={titleStartRef} className="inline-block text-white">
          {splitText("Cookie")}
        </span>
        <span ref={titleEndRef} className="inline-block text-orange-500">
          {splitText("Capes")}
        </span>
      </h1>

      <div ref={tagsRef} className="flex flex-wrap justify-center gap-4 md:gap-8">
        {["Schnell", "Performant", "Kostenlos"].map((tag, i) => (
          <div 
            key={i} 
            className="px-6 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 font-bold backdrop-blur-sm shadow-[0_0_15px_rgba(249,115,22,0.2)]"
          >
            {tag}
          </div>
        ))}
      </div>
      
      <p ref={descriptionRef} className="max-w-xl text-zinc-400 mt-4 text-sm md:text-base">
        Lade dein eigenes Cape hoch und zeige es allen Spielern.
        <br/>
        Einfach, kostenlos und direkt im Spiel sichtbar.
      </p>

      <div ref={buttonsRef} className="flex flex-wrap justify-center gap-4 mt-4">
          <button 
            onClick={scrollToSetup}
            className="group relative overflow-hidden rounded-full bg-orange-500 px-8 py-3 font-bold text-white transition-all hover:bg-orange-600 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
          >
              <span className="relative z-10">Create Cape</span>
          </button>
          
          <button 
            onClick={() => window.location.href = 'cookiecapes/capes'}
            className="group relative overflow-hidden rounded-full border border-white/10 bg-white/10 px-8 py-3 font-bold text-white transition-all hover:bg-white/10 hover:scale-105 active:scale-95"
          >
              <span className="relative z-10">Browse Capes</span>
          </button>
      </div>
    </div>
  );
}
