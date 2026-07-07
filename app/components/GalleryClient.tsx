"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Asset } from "../lib/types";

const sanitizeUrl = (url: string) => {
    if (typeof url !== "string") {
        return "about:blank";
    }

    if (!url.startsWith("/galerie/")) {
        return "about:blank";
    }

    const filenamePart = url.slice("/galerie/".length);

    if (
        !filenamePart ||
        filenamePart.includes("..") ||
        filenamePart.includes("\\") ||
        filenamePart.startsWith("/")
    ) {
        return "about:blank";
    }

    const safeFilename = encodeURIComponent(decodeURIComponent(filenamePart));
    return `/galerie/${safeFilename}`;
};

export default function GalleryClient({ allAssets }: { allAssets: Asset[] }) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [selectedSeason, setSelectedSeason] = useState<number | "all">("all");
    const [isZoomed, setIsZoomed] = useState(false);
    
    const filteredAssets = selectedSeason === "all" 
        ? allAssets 
        : allAssets.filter(asset => asset.season === selectedSeason);

    const containerRef = useRef<HTMLDivElement>(null);
    
    const seasons = Array.from(new Set(allAssets.map(a => a.season))).sort((a, b) => a - b);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setIsZoomed(false);
        document.body.style.overflow = "hidden";
    };

    const closeLightbox = () => {
        setLightboxIndex(null);
        setIsZoomed(false);
        document.body.style.overflow = "unset";
    };

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev! + 1) % filteredAssets.length);
            setIsZoomed(false);
        }
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev! - 1 + filteredAssets.length) % filteredAssets.length);
            setIsZoomed(false);
        }
    };

    const toggleZoom = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (lightboxIndex !== null && filteredAssets[lightboxIndex].type === "image") {
            setIsZoomed(!isZoomed);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex === null) return;
            
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") nextImage();
            if (e.key === "ArrowLeft") prevImage();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxIndex, filteredAssets]);

    useGSAP(() => {
        gsap.fromTo(".gallery-item", 
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power2.out" }
        );
    }, { scope: containerRef, dependencies: [selectedSeason] });

    const currentAsset = lightboxIndex !== null ? filteredAssets[lightboxIndex] : null;

    return (
        <div ref={containerRef} className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
            
            <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
                <h1 className="font-nexa text-4xl md:text-5xl text-white">Galerie</h1>
                <Link 
                    href="/" 
                    className="px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors font-bold text-sm"
                >
                    Zurück
                </Link>
            </div>

            <div className="max-w-7xl mx-auto mb-10 overflow-x-auto pb-4">
                <div className="flex gap-3">
                    <button
                        onClick={() => setSelectedSeason("all")}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border ${
                            selectedSeason === "all" 
                            ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                            : "bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300 cursor-pointer"
                        }`}
                    >
                        Alle
                    </button>
                    {seasons.map(season => (
                        <button
                            key={season}
                            onClick={() => setSelectedSeason(season)}
                            className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border flex gap-1 ${
                                selectedSeason === season 
                                ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                                : "bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer"
                            }`}
                        >
                            <span className={selectedSeason === season ? "text-white" : "text-orange-500"}>Cookie</span><span className={selectedSeason === season ? "text-white" : "text-zinc-300"}>Attack {season}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map((asset, index) => (
                    <div 
                        key={asset.id} 
                        onClick={() => openLightbox(index)}
                        className="gallery-item relative aspect-video rounded-xl overflow-hidden cursor-pointer border border-white/10 bg-zinc-900 group"
                    >
                        <div className="absolute top-3 left-3 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex gap-1">
                            <span className="text-orange-500">Cookie</span>
                            <span className="text-white">Attack {asset.season}</span>
                        </div>

                        {asset.type === 'video' ? (
                             <div className="relative w-full h-full">
                                <video 
                                    src={sanitizeUrl(asset.src)} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                    muted
                                    playsInline
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 drop-shadow-lg">
                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                    </svg>
                                </div>
                             </div>
                        ) : (
                            <Image 
                                src={asset.src} 
                                alt={`Gallery Item Season ${asset.season}`}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                ))}
            </div>

            {currentAsset && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={closeLightbox}
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <button 
                         onClick={prevImage}
                         className="absolute left-4 md:left-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 cursor-pointer hidden md:block"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <button 
                         onClick={nextImage}
                         className="absolute right-4 md:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 cursor-pointer hidden md:block"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                         </svg>
                    </button>

                    <div 
                        className={`
                            relative transition-transform duration-300 ease-out
                            ${isZoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"}
                            max-w-[90vw] max-h-[85vh] w-full h-full flex items-center justify-center
                        `}
                        onClick={toggleZoom}
                    >
                        {currentAsset.type === 'video' ? (
                             <video 
                                src={sanitizeUrl(currentAsset.src)} 
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                                controls
                                autoPlay
                                onClick={(e) => e.stopPropagation()} 
                             />
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <Image 
                                    src={currentAsset.src} 
                                    alt={`Season ${currentAsset.season}`}
                                    className="object-contain"
                                    fill
                                    quality={100}
                                    sizes="90vw"
                                />
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-6 left-0 w-full text-center text-zinc-400 font-medium pointer-events-none space-y-2">
                        <div className="flex justify-center gap-1 font-bold">
                            <span className="text-orange-500">Cookie</span>
                            <span className="text-white">Attack {currentAsset.season}</span>
                        </div>
                        <div className="text-sm opacity-60">
                            {(lightboxIndex ?? 0) + 1} / {filteredAssets.length}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
