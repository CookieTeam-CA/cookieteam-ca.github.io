"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Footer from "../components/Footer";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export default function CookieTeamPage() {
  const container = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.from(".hero-logo", {
      scale: 0,
      rotation: -180,
      opacity: 0,
      duration: 1,
      ease: "back.out(1.7)"
    })
    .from(".hero-title", {
      y: 50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.5")
    .from(".hero-text", {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.6");

    gsap.from(".about-content",   {
      scrollTrigger: {
        trigger: aboutRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      },
      x: -50,
      opacity: 0,
      duration: 1,
      ease: "power3.out"
    });

    gsap.from(".about-image", {
        scrollTrigger: {
          trigger: aboutRef.current,
          start: "top 80%",
          toggleActions: "play none none none"
        },
        x: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.2
    });

    gsap.from(ctaRef.current, {
        scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 85%",
            toggleActions: "play none none none"
        },
        scale: 0.9,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out"
    });

  }, { scope: container });

  return (
    <div ref={container} className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      <nav className="absolute top-0 left-0 p-6 z-10">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            ← Zurück
        </Link>
      </nav>

      <div className="container mx-auto px-4 py-20 max-w-5xl">
        <header ref={heroRef} className="text-center mb-16 space-y-4">
           <div className="hero-logo relative w-32 h-32 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:border-white/20 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
             <Image 
                src="/minilogo.png" 
                alt="CookieTeam Logo" 
                width={80} 
                height={80} 
                className="object-contain"
             />
           </div>
           
           <h1 className="hero-title text-5xl md:text-7xl font-bold tracking-tight font-nexa bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent pb-2">
            CookieTeam
          </h1>
          <p className="hero-text text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Das Team hinter CookieCapes, CookieAttack und mehr.
          </p>
        </header>

        <section ref={aboutRef} className="mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
             <div className="about-content space-y-6">
                <h2 className="text-3xl font-bold font-nexa text-white">Wer wir sind</h2>
                <div className="h-1 w-20 bg-blue-500 rounded-full"></div>
                <p className="text-gray-300 leading-relaxed text-lg">
                  Wir sind eine leidenschaftliche Gruppe von Entwicklern. 
                  Unser Ziel ist es, einzigartige Projekte wie den <strong>CookieAttack Minecraft Server</strong> und 
                  das <strong>CookieCapes</strong> System zu realisieren und stetig zu verbessern.
                </p>
                <div className="flex gap-4 pt-4">
                    <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">Development</span>
                    <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">Hosting</span>
                    <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">Community</span>
                </div>
             </div>
             <div className="about-image relative h-64 md:h-full bg-gradient-to-tr from-blue-900/20 to-purple-900/20 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center">
                 <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-20">
                    {[...Array(36)].map((_, i) => (
                        <div key={i} className="border-[0.5px] border-white/10"></div>
                    ))}
                 </div>
                 <div className="z-10 text-center">
                    <span className="text-6xl">🍪</span>
                 </div>
             </div>
          </div>
        </section>

        <section ref={servicesRef} className="bg-white/5 rounded-3xl p-8 md:p-12 border border-white/10 relative overflow-hidden group">
           
           <div className="relative z-10 text-center space-y-8">
              <div ref={ctaRef}>
                  <h2 className="text-4xl font-bold font-nexa">Du hast eine Idee? Wir setzen sie um!</h2>
                  <p className="text-gray-300 text-lg max-w-2xl mx-auto mt-4">
                    Du hast eine Idee für einen Minecraft Server/Netwerk, eine Website oder einen Discord Bot?
                    Schreib uns an! Wir übernehmen für dich programmierung, das Zusammenstellen des Servers und das Hosting.
                  </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto pt-8">
                  <div className="service-card p-6 bg-black/40 rounded-xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 text-blue-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                          </svg>
                      </div>
                      <h3 className="text-xl font-bold mb-2">Programmierung</h3>
                      <p className="text-gray-400 text-sm">Entwicklung von Plugins, Websiten und Anwendungen nach deinen Wünschen.</p>
                  </div>

                  <div className="service-card p-6 bg-black/40 rounded-xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 text-purple-400">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h9.45a3.375 3.375 0 012.7 1.35L20.7 8.55a4.5 4.5 0 01.9 2.7l.9 2.7c.412 1.237-.47 2.55-1.742 2.55H2.342c-1.272 0-2.155-1.313-1.742-2.55l.9-2.7z" />
                            </svg>
                      </div>
                      <h3 className="text-xl font-bold mb-2">Server Setup</h3>
                      <p className="text-gray-400 text-sm">Einrichtung und Konfiguration deiner Server-Infrastruktur.</p>
                  </div>

                   <div className="service-card p-6 bg-black/40 rounded-xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 text-green-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                          </svg>
                      </div>
                      <h3 className="text-xl font-bold mb-2">Hosting</h3>
                      <p className="text-gray-400 text-sm">Zuverlässiges Hosting für deine Projekte auf unseren Systemen.</p>
                  </div>
              </div>

              <div className="pt-8">
                  <a 
                    href="mailto:leon@cookieattack.de"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-black bg-white rounded-full hover:bg-gray-200 transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  >
                    Kontakt aufnehmen
                  </a>
                  <p className="mt-4 text-sm text-gray-500">
                      Oder schreib uns auf Discord!
                  </p>
              </div>
           </div>
        </section>
      </div>
      <Footer/>
    </div>
  );
}
