"use client";

import { Button } from "@/components/ui/button";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Asset } from "../lib/types";
import { useElementActive } from "../lib/visibility";

export default function GallerySection({ allAssets }: { allAssets: Asset[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const carouselAssets = allAssets;

    const slidesRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);
    const active = useElementActive(carouselRef);
    const nearby = useElementActive(carouselRef, "800px");
    const [autoPlayVersion, setAutoPlayVersion] = useState(0);

    const totalSlides = carouselAssets.length;
    const slideDuration = 0.8;
    const autoPlayDelay = 4000;

    const goToSlide = (index: number) => {
        if (totalSlides === 0) return;
        setCurrentIndex(() => {
            let newIndex = index;
            if (newIndex < 0) newIndex = totalSlides - 1;
            if (newIndex >= totalSlides) newIndex = 0;
            return newIndex;
        });
        setAutoPlayVersion(version => version + 1);
    };

    const nextSlide = () => goToSlide(currentIndex + 1);
    const prevSlide = () => goToSlide(currentIndex - 1);

    useEffect(() => {
        if (!active || totalSlides < 2) return;
        const interval = setInterval(() => setCurrentIndex(index => (index + 1) % totalSlides), autoPlayDelay);
        return () => clearInterval(interval);
    }, [active, totalSlides, autoPlayVersion]);

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
                <div ref={carouselRef} className="relative w-full overflow-hidden rounded-lg shadow-xl border border-white/10 mb-12">
                    <div ref={slidesRef} className="flex w-full h-100 md:h-125 lg:h-150">
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
                                    <CarouselVideo asset={asset} active={active && currentIndex === index} nearby={nearby} />
                                ) : nearby ? (
                                    <Image
                                        src={asset.src}
                                        alt="Gallery Image"
                                        fill
                                        className="object-cover"
                                        // Removed priority={index === 0} to improve initial page load since this is below the fold
                                        loading="lazy"
                                        sizes="(max-width: 1280px) calc(100vw - 48px), 1232px"
                                    />
                                ) : null}
                            </div>
                        ))}
                    </div>

                    {totalSlides > 1 && (
                        <>
                            <Button variant="outline" size="icon-lg"
                                onClick={prevSlide}
                                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 active:-translate-y-1/2! rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
                                aria-label="Zurück"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </Button>
                            <Button variant="outline" size="icon-lg"
                                onClick={nextSlide}
                                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 active:-translate-y-1/2! rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
                                aria-label="Weiter"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </Button>
                        </>
                    )}

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {carouselAssets.map((_, index) => (
                            <Button variant="ghost" size="icon-xs"
                                key={index}
                                onClick={() => goToSlide(index)}
                                aria-label={`Gehe zu Bild ${index + 1}`}
                                aria-pressed={currentIndex === index}
                                className={`size-3 rounded-full p-0 shadow-lg ${currentIndex === index ? 'bg-orange-500 w-5' : 'bg-white/50 hover:bg-white/70'
                                    }`}
                            ></Button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center">
                    <Button asChild variant="outline" size="lg"><Link href="/galerie">
                        <span className="relative z-10">Alle Anzeigen</span>
                    </Link></Button>
                </div>
            </div>
        </div>
    );
}

function CarouselVideo({ asset, active, nearby }: { asset: Asset; active: boolean; nearby: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (active) void video.play().catch(() => { });
        else video.pause();
        return () => video.pause();
    }, [active]);
    // Removing an inactive source also releases the decoder and its frame buffers.
    return <video ref={videoRef} src={active ? asset.src : undefined} poster={nearby ? asset.poster : undefined} preload="none" className="w-full h-full object-cover" loop muted playsInline />;
}
