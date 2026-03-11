"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Asset } from "../lib/types";

export default function GallerySection({ allAssets }: { allAssets: Asset[] }) {
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
                                        // Removed priority={index === 0} to improve initial page load since this is below the fold
                                        loading="lazy"
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
                                aria-label="Zurück"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <button 
                                onClick={nextSlide} 
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-10 cursor-pointer backdrop-blur-sm border border-white/10"
                                aria-label="Weiter"
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
                                aria-label={`Gehe zu Bild ${index + 1}`}
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
}
