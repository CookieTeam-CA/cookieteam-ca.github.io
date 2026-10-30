"use client";

import { Button } from "@/components/ui/button";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "../lib/visibility";
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

    const filteredAssets = useMemo(() => selectedSeason === "all" ? allAssets : allAssets.filter(asset => asset.season === selectedSeason), [allAssets, selectedSeason]);

    const containerRef = useRef<HTMLDivElement>(null);
    const lightbox = useRef<HTMLDialogElement>(null);
    const trigger = useRef<HTMLElement | null>(null);
    const reducedMotion = useReducedMotion();
    const lightboxOpen = lightboxIndex !== null;

    const seasons = Array.from(new Set(allAssets.map(a => a.season))).sort((a, b) => a - b);

    const openLightbox = (index: number) => {
        trigger.current = document.activeElement as HTMLElement;
        setLightboxIndex(index);
        setIsZoomed(false);
    };

    const closeLightbox = useCallback(() => {
        setLightboxIndex(null);
        setIsZoomed(false);
    }, []);

    const nextImage = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev! + 1) % filteredAssets.length);
            setIsZoomed(false);
        }
    }, [lightboxIndex, filteredAssets.length]);

    const prevImage = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev! - 1 + filteredAssets.length) % filteredAssets.length);
            setIsZoomed(false);
        }
    }, [lightboxIndex, filteredAssets.length]);

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
    }, [lightboxIndex, nextImage, prevImage, closeLightbox]);

    useEffect(() => {
        if (lightboxIndex === null) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = original; };
    }, [lightboxIndex]);

    useEffect(() => {
        const dialog = lightbox.current;
        if (!lightboxOpen || !dialog) return;
        dialog.showModal();
        return () => { dialog.close(); trigger.current?.focus(); };
    }, [lightboxOpen]);

    useGSAP(() => {
        if (reducedMotion) return;
        gsap.fromTo(".gallery-item",
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power2.out" }
        );
    }, { scope: containerRef, dependencies: [selectedSeason, reducedMotion], revertOnUpdate: true });

    const currentAsset = lightboxIndex !== null ? filteredAssets[lightboxIndex] : null;

    return (
        <div ref={containerRef} className="min-h-screen bg-[#050505] text-white p-6 md:p-12">

            <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
                <h1 className="font-nexa text-4xl md:text-5xl text-white">Galerie</h1>
                <Button asChild variant="outline"><Link href="/">
                    Zurück
                </Link></Button>
            </div>

            <div className="max-w-7xl mx-auto mb-10 overflow-x-auto pb-4">
                <div className="flex gap-3">
                    <Button variant={selectedSeason === "all" ? "default" : "outline"}
                        onClick={() => setSelectedSeason("all")}
                        aria-pressed={selectedSeason === "all"}
                    >
                        Alle
                    </Button>
                    {seasons.map(season => (
                        <Button variant={selectedSeason === season ? "default" : "outline"}
                            key={season}
                            onClick={() => setSelectedSeason(season)}
                            aria-pressed={selectedSeason === season}
                            className="gap-1"
                        >
                            <span className={selectedSeason === season ? "text-white" : "text-orange-500"}>Cookie</span><span className={selectedSeason === season ? "text-white" : "text-zinc-300"}>Attack {season}</span>
                        </Button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map((asset, index) => (
                    <button
                        type="button"
                        key={asset.id}
                        aria-label={`CookieAttack ${asset.season}: ${asset.type === "video" ? "Video" : "Bild"} ${index + 1} öffnen`}
                        onClick={() => openLightbox(index)}
                        className="gallery-item relative block w-full aspect-video focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400 rounded-xl overflow-hidden cursor-pointer border border-white/10 bg-zinc-900 group"
                    >
                        <span className="absolute top-3 left-3 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex gap-1">
                            <span className="text-orange-500">Cookie</span>
                            <span className="text-white">Attack {asset.season}</span>
                        </span>

                        {asset.type === 'video' ? (
                            <span className="relative block w-full h-full">
                                {asset.poster ? <Image src={asset.poster} alt={`Video CookieAttack ${asset.season}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" /> : <video src={sanitizeUrl(asset.src)} preload="metadata" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" muted playsInline />}
                                <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 drop-shadow-lg">
                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            </span>
                        ) : (
                            <Image
                                src={asset.src}
                                alt={`Gallery Item Season ${asset.season}`}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        )}
                        <span className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                ))}
            </div>

            {currentAsset && (
                <dialog ref={lightbox} aria-label="CookieAttack Galerie" onCancel={closeLightbox}
                    className="fixed inset-0 m-0 h-dvh w-screen max-h-none max-w-none overscroll-contain border-0 p-0 text-white open:flex items-center justify-center bg-black/95 backdrop:bg-black/95 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={event => { if (event.target === event.currentTarget) closeLightbox(); }}
                >
                    <Button variant="secondary" size="icon-lg" aria-label="Galerie schließen"
                        onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                        className="absolute right-6 top-6 z-50 rounded-full"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Button>

                    <Button variant="secondary" size="icon-lg" aria-label="Vorheriges Bild"
                        onClick={prevImage}
                        className="absolute left-4 z-50 hidden rounded-full md:left-8 md:inline-flex"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Button>
                    <Button variant="secondary" size="icon-lg" aria-label="Nächstes Bild"
                        onClick={nextImage}
                        className="absolute right-4 z-50 hidden rounded-full md:right-8 md:inline-flex"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </Button>

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

                </dialog>
            )}
        </div>
    );
}
