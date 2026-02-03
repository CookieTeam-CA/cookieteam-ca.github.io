"use client";

import { useEffect, useRef, useState } from "react";
import type { SkinViewer } from "skinview3d";

interface CapeViewerProps {
  capeUrl?: string | null;
  skinUrl?: string;
  width?: number;
  height?: number;
}

export default function CapeViewer({ capeUrl, skinUrl = "http://textures.minecraft.net/texture/1a68cc5d652ea63388033c5bb0d515479ce94e4d2f84022f0b94503cf8f80ba2", width, height }: CapeViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        },
        { rootMargin: "200px" }
    );

    if (containerRef.current) {
        observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
        setWebglSupported(false);
        return;
    }
    setWebglSupported(true);

    let viewer: SkinViewer | null = null;
    let animation: any = null;
    let resizeObserver: ResizeObserver | null = null;

    const initViewer = async () => {
        if (!canvasRef.current || !containerRef.current) return;

        try {
            const skinview3d = await import("skinview3d");

            const initialWidth = width || containerRef.current.clientWidth;
            const initialHeight = height || containerRef.current.clientHeight;

            viewer = new skinview3d.SkinViewer({
                canvas: canvasRef.current,
                width: initialWidth,
                height: initialHeight,
            });

            viewerRef.current = viewer;

            viewer.camera.position.x = -20;
            viewer.camera.position.y = 10;
            viewer.camera.position.z = 40;
            
            if (viewer.controls) {
                viewer.controls.minDistance = 10;
                viewer.controls.maxDistance = 80;
                viewer.controls.enablePan = false;
                viewer.controls.enableZoom = true;
                viewer.controls.enableRotate = true;
            }
            
            animation = new skinview3d.WalkingAnimation();
            animation.speed = 0.5;
            viewer.animation = animation;

            loadTextures(viewer, capeUrl, skinUrl);

            resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                     if (viewer && !width && !height) {
                         viewer.setSize(entry.contentRect.width, entry.contentRect.height);
                     }
                }
            });
            resizeObserver.observe(containerRef.current);

        } catch (error) {
            console.error("Failed to load skinview3d:", error);
        }
    };

    initViewer();

    return () => {
      if (viewer) viewer.dispose();
      viewerRef.current = null;
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [isVisible]); 

  useEffect(() => {
      if (viewerRef.current) {
          loadTextures(viewerRef.current, capeUrl, skinUrl);
      }
  }, [capeUrl, skinUrl]);

  useEffect(() => {
      if (viewerRef.current && width && height) {
          viewerRef.current.setSize(width, height);
      }
  }, [width, height]);


  const loadTextures = (viewer: SkinViewer, cape: string | null | undefined, skin: string | undefined) => {
        const getProxiedUrl = (url: string | null | undefined) => {
            if (!url) return null;
            if (url.startsWith("blob:") || url.startsWith("data:")) return url;
            return `/api/proxy?url=${encodeURIComponent(url)}`;
        };

        const finalSkinUrl = getProxiedUrl(skin);
        if (finalSkinUrl) {
             viewer.loadSkin(finalSkinUrl);
        } else {
             viewer.loadSkin(null);
        }

        const finalCapeUrl = getProxiedUrl(cape);
        if (finalCapeUrl) {
            viewer.loadCape(finalCapeUrl);
        } else {
            viewer.loadCape(null);
        }
  };

  if (webglSupported === false) {
      return (
          <div ref={containerRef} className="relative rounded-lg overflow-hidden shadow-2xl bg-zinc-900 border border-white/10 flex items-center justify-center p-6 text-center" style={{ width: width || '100%', height: height || '100%' }}>
              <div className="flex flex-col items-center gap-4">
                  <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-white font-bold">3D Vorschau nicht verfügbar</p>
                  <p className="text-sm text-zinc-400">Dein Browser unterstützt kein WebGL.</p>
              </div>
          </div>
      );
  }

  return (
    <div ref={containerRef} className="relative rounded-lg overflow-hidden shadow-2xl bg-black/20 border border-white/10" style={{ width: width || '100%', height: height || '100%' }}>
      {isVisible ? <canvas ref={canvasRef} className="w-full h-full" /> : null}
    </div>
  );
}
