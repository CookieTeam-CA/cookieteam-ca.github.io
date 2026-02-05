"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Asset } from "../lib/types";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { label: "Teilnehmer", value: 350, suffix: "+", decimals: 0 },
  { label: "Spielstunden", value: 15000, suffix: "+", decimals: 0, formatThousands: true },
  { label: "Weltdaten", value: 320, suffix: "+ GB", decimals: 0 },
  { label: "Uptime", value: 99.8, suffix: " %", decimals: 1 },
  { label: "avg Latenz", value: 45, prefix: "< ", suffix: " ms", decimals: 0 },
];

export default function HomeClient({ initialAssets }: { initialAssets: Asset[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const titleStartRef = useRef<HTMLSpanElement>(null);
  const titleEndRef = useRef<HTMLSpanElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const statsRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    gsap.set([pillRef.current, buttonsRef.current], { autoAlpha: 0, y: 20 });
    
    const startChars = titleStartRef.current?.children;
    const endChars = titleEndRef.current?.children;
    
    if (startChars && endChars) {
        gsap.set([...Array.from(startChars), ...Array.from(endChars)], { y: 100, autoAlpha: 0 });
    }

    tl.to(pillRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
      delay: 0.2
    })
    .to([...Array.from(startChars || []), ...Array.from(endChars || [])], {
        y: 0,
        autoAlpha: 1,
        stagger: 0.05,
        duration: 1,
        ease: "back.out(1.7)"
    }, "-=0.4")
    .to(buttonsRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
    }, "-=0.6");

    statsRefs.current.forEach((stat, index) => {
      if (!stat) return;
      
      const valueSpan = stat.querySelector(".stat-value");
      const targetValue = stats[index].value;
      const proxy = { value: 0 };

      gsap.fromTo(stat, 
        { autoAlpha: 0, y: 50 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: statsSectionRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      gsap.to(proxy, {
        value: targetValue,
        duration: 2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: statsSectionRef.current,
          start: "top 80%",
          once: true
        },
        onUpdate: () => {
          if (valueSpan) {
            let formatted = proxy.value.toFixed(stats[index].decimals);
            if (stats[index].formatThousands) {
              formatted = Number(formatted).toLocaleString("de-DE");
            } else {
                 formatted = formatted.replace(".", ",");
            }
            if (stats[index].decimals === 0 && !stats[index].formatThousands) {
                 formatted = Math.round(proxy.value).toString();
            }

            valueSpan.textContent = `${stats[index].prefix || ""}${formatted}${stats[index].suffix || ""}`;
          }
        }
      });
    });

  }, { scope: containerRef });

  const splitText = (text: string) => {
    return text.split("").map((char, index) => (
      <span key={index} className="inline-block">{char}</span>
    ));
  };

  const scrollToStats = () => {
    statsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className="relative bg-[#050505] text-white overflow-x-hidden">
      <div ref={heroSectionRef} className="relative flex min-h-screen flex-col items-center justify-center z-10">
        <div className="flex flex-col items-center gap-10">
          <div 
            ref={pillRef} 
            className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2 backdrop-blur-md opacity-0"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-zinc-300">Coming Soon: CookieAttack 6</span>
          </div>

          <h1 className="font-nexa text-6xl md:text-8xl lg:text-9xl tracking-tighter text-center overflow-hidden leading-tight">
            <span ref={titleStartRef} className="inline-block text-orange-500">
              {splitText("Cookie")}
            </span>
            <span ref={titleEndRef} className="inline-block text-white">
              {splitText("Attack")}
            </span>
          </h1>

          <div ref={buttonsRef} className="flex flex-wrap items-center justify-center gap-5 opacity-0">
            <button 
                onClick={scrollToStats}
                className="group relative overflow-hidden rounded-full bg-white px-8 py-3.5 font-bold text-black transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span className="relative z-10">CookieAttack</span>
              <div className="absolute inset-0 -z-10 translate-y-full bg-orange-500 transition-transform duration-300 group-hover:translate-y-0"></div>
            </button>
            <Link 
              href="/cookieteam"
              className="group relative overflow-hidden rounded-full border border-white/20 bg-white/5 px-8 py-3.5 font-bold text-white transition-all hover:scale-105 active:scale-95 hover:border-orange-500 hover:bg-orange-500/10 hover:text-orange-500 cursor-pointer"
            >
               <span className="relative z-10">CookieTeam</span>
            </Link>

            <Link 
              href="/cookiecapes"
              className="group relative overflow-hidden rounded-full border border-white/20 bg-white/5 px-8 py-3.5 font-bold text-white transition-all hover:scale-105 active:scale-95 hover:border-orange-500 hover:bg-orange-500/10 hover:text-orange-500 cursor-pointer"
            >
               <span className="relative z-10">CookieCapes</span>
            </Link>
          </div>
        </div>
      </div>
      <div ref={statsSectionRef} className="relative flex min-h-[50vh] w-full items-center justify-center py-20 bg-[#050505]">
          <div className="w-full max-w-7xl px-6">
             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 text-center">
                {stats.map((stat, index) => (
                    <div 
                        key={index} 
                        ref={(el) => { statsRefs.current[index] = el }}
                        className="flex flex-col items-center gap-2"
                    >
                        <span className="stat-value font-nexa text-4xl md:text-5xl lg:text-5xl text-white">
                           {stat.prefix || ""}0{stat.suffix || ""}
                        </span>
                        <span className="text-sm uppercase tracking-widest text-zinc-500 font-medium">
                            {stat.label}
                        </span>
                    </div>
                ))}
             </div>
          </div>
      </div>

      <TimelineSection />
      
      <GallerySection allAssets={initialAssets} />

      <div className="relative flex w-full flex-col items-center justify-center py-32 bg-[#050505] text-center gap-8">
        <h2 className="font-nexa text-4xl md:text-6xl text-white max-w-4xl px-4 leading-tight">
          Bock auf das Projekt? 
          <br />
          <span className="text-orange-500">Joine Jetzt!</span>
        </h2>
        <a 
          href="https://dc.cookieattack.de" 
          target="_blank"
          rel="noopener noreferrer"
          className="group relative overflow-hidden rounded-full bg-[#5865F2] px-10 py-4 font-bold text-white transition-all hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-[#5865F2]/30"
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-14.36a.074.074 0 0 0-.032-.027zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Joine den Discord!
          </span>
        </a>
      </div>
    </div>
  );
}

const TimelineSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const timelineEvents = [
    { title: "CookieAttack 1", status: "VERGANGENHEIT", year: "2022" },
    { title: "CookieAttack 2", status: "VERGANGENHEIT", year: "2023" },
    { title: "CookieAttack 3", status: "VERGANGENHEIT", year: "2024" },
    { title: "CookieAttack 4", status: "VERGANGENHEIT", year: "2024" },
    { title: "CookieAttack 5", status: "AKTUELL", year: "2025" },
    { title: "CookieAttack 6", status: "GEPLANNT", year: "2026" },
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
};


const GallerySection = ({ allAssets }: { allAssets: Asset[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [carouselAssets, setCarouselAssets] = useState<Asset[]>([]);
    
    const slidesRef = useRef<HTMLDivElement>(null);
    const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const totalSlides = carouselAssets.length;
    const slideDuration = 0.8;
    const autoPlayDelay = 4000;

    useEffect(() => {
        if (allAssets.length > 0) {
            const shuffled = [...allAssets].sort(() => 0.5 - Math.random());
            setCarouselAssets(shuffled.slice(0, 8));
        }
    }, [allAssets]);

    const goToSlide = (index: number) => {
        if (totalSlides === 0) return;
        setCurrentIndex((prevIndex) => {
            let newIndex = index;
            if (newIndex < 0) newIndex = totalSlides - 1;
            if (newIndex >= totalSlides) newIndex = 0;
            return newIndex;
        });
        resetAutoPlay();
    };

    const nextSlide = () => goToSlide(currentIndex + 1);
    const prevSlide = () => goToSlide(currentIndex - 1);

    const resetAutoPlay = () => {
        if (autoPlayIntervalRef.current) {
            clearInterval(autoPlayIntervalRef.current);
        }
        if (totalSlides > 0) {
             autoPlayIntervalRef.current = setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
            }, autoPlayDelay);
        }
    };

    useEffect(() => {
        resetAutoPlay();
        return () => {
            if (autoPlayIntervalRef.current) clearInterval(autoPlayIntervalRef.current);
        };
    }, [totalSlides]);

    useGSAP(() => {
        if (slidesRef.current && totalSlides > 0) {
            gsap.to(slidesRef.current, {
                xPercent: -currentIndex * 100,
                duration: slideDuration,
                ease: "power3.out",
            });
        }
    }, { dependencies: [currentIndex, totalSlides], scope: slidesRef });

    return (
        <div className="w-full py-24 bg-[#050505] overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="relative w-full overflow-hidden rounded-lg shadow-xl border border-white/10 mb-12">
                    <div ref={slidesRef} className="flex w-full h-[400px] md:h-[500px] lg:h-[600px]">
                        {carouselAssets.map((asset, index) => (
                            <div 
                                key={asset.id} 
                                className="flex-none w-full h-full relative"
                            >
                                <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex gap-1">
                                    <span className="text-orange-500">Cookie</span>
                                    <span className="text-white">Attack {asset.season}</span>
                                </div>

                                {asset.type === 'video' ? (
                                    <video 
                                        src={asset.src} 
                                        className="w-full h-full object-cover" 
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline
                                    />
                                ) : (
                                    <Image 
                                        src={asset.src} 
                                        alt="Gallery Image"
                                        fill
                                        className="object-cover"
                                        priority={index === 0}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {totalSlides > 1 && (
                        <>
                            <button 
                                onClick={prevSlide} 
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-10 cursor-pointer backdrop-blur-sm border border-white/10"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <button 
                                onClick={nextSlide} 
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-10 cursor-pointer backdrop-blur-sm border border-white/10"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </>
                    )}

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {carouselAssets.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-3 h-3 rounded-full transition-all cursor-pointer shadow-lg ${
                                    currentIndex === index ? 'bg-orange-500 w-5' : 'bg-white/50 hover:bg-white/70'
                                }`}
                            ></button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center">
                    <Link 
                        href="/galerie"
                        className="group relative overflow-hidden rounded-full border border-white/20 bg-white/5 px-8 py-3.5 font-bold text-white transition-all hover:scale-105 active:scale-95 hover:border-orange-500 hover:bg-orange-500/10 hover:text-orange-500 cursor-pointer"
                    >
                         <span className="relative z-10">Alle Anzeigen</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};
