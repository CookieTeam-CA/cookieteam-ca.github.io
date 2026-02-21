"use client";

import { useEffect, useRef, useState } from "react";
import { SkinViewer, WalkingAnimation, IdleAnimation } from "skinview3d";

interface Cape3DViewerProps {
    skinUrl?: string;
    capeUrl: string;
    minecraftName?: string;
}

export default function Cape3DViewer({ skinUrl, capeUrl, minecraftName }: Cape3DViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewerRef = useRef<SkinViewer | null>(null);
    
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                    setIsLoading(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "100px" }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) {
             setIsLoading(false);
             return;
        }

        let viewer: SkinViewer | null = null;
        let resizeObserver: ResizeObserver | null = null;
        let stopRotation: (() => void) | null = null;

        try {
            viewer = new SkinViewer({
                canvas: canvas,
                width: 300, 
                height: 400,
                skin: skinUrl || (minecraftName ? `https://minotar.net/skin/${minecraftName}` : "https://minotar.net/skin/MHF_Steve"),
                cape: capeUrl,
                zoom: 0.7
            });

            viewer.camera.position.set(0, 0, 60);
            viewer.controls.enableZoom = true;
            viewer.controls.enableRotate = true;
            
            const animation = new IdleAnimation();
            viewer.animation = animation;
            
            viewer.playerObject.rotation.y = Math.PI;

            viewer.autoRotate = true;
            viewer.autoRotateSpeed = 0.5;

            stopRotation = () => {
                if (viewer) {
                    viewer.autoRotate = false;
                }
            };
            canvas.addEventListener("mousedown", stopRotation);
            canvas.addEventListener("touchstart", stopRotation, { passive: true });

            viewerRef.current = viewer;

            setTimeout(() => setIsLoading(false), 500);

            resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.contentRect && viewer) {
                        try {
                           viewer.setSize(entry.contentRect.width, entry.contentRect.height);
                        } catch (e) {
                        }
                    }
                }
            });

            if (canvas.parentElement) {
                resizeObserver.observe(canvas.parentElement);
            }

        } catch (e) {
            console.error("Failed to initialize skin viewer", e);
            setIsLoading(false);
        }

        return () => {
             if (stopRotation && canvas) {
                 canvas.removeEventListener("mousedown", stopRotation);
                 canvas.removeEventListener("touchstart", stopRotation);
             }
             if (resizeObserver) resizeObserver.disconnect();
             if (viewer) {
                 try {
                     viewer.dispose();
                 } catch (e) {
                 }
             }
             viewerRef.current = null;
        };
    }, [isVisible, skinUrl, capeUrl, minecraftName]);

    useEffect(() => {
        if (viewerRef.current && isVisible) {
             setIsLoading(true);
             setTimeout(() => setIsLoading(false), 300);
        }
    }, [isVisible, skinUrl, capeUrl]);

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden relative">
            {isVisible ? (
                <>
                    <canvas ref={canvasRef} className={`outline-none transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`} />
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                        </div>
                    )}
                </>
            ) : (
                <div className="w-full h-full bg-zinc-900/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-zinc-700/50 border-t-zinc-700 rounded-full animate-spin opacity-50" />
                </div>
            )}
        </div>
    );
}
