"use client";

import { useEffect, useRef, useState } from "react";
import type { SkinViewer } from "skinview3d";

interface CapeViewerProps {
  capeUrl?: string | null;
  skinUrl?: string;
  minecraftName?: string;
  width?: number;
  height?: number;
  animation?: "idle" | "walk" | "run" | "none";
}

export default function CapeViewer({ 
    capeUrl, 
    skinUrl, 
    minecraftName,
    width, 
    height,
    animation = "idle" 
}: CapeViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
            const entry = entries[0];
            if (entry.isIntersecting) {
                if (!hasLoaded) {
                    setHasLoaded(true);
                    setIsLoading(true);
                }
                if (viewerRef.current) {
                    viewerRef.current.renderPaused = false;
                }
            } else {
                if (viewerRef.current) {
                    viewerRef.current.renderPaused = true;
                }
            }
        },
        { rootMargin: "50px" }
    );

    if (containerRef.current) {
        observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasLoaded]);

  useEffect(() => {
    if (!hasLoaded) return;

    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
        setWebglSupported(false);
        setIsLoading(false);
        return;
    }
    setWebglSupported(true);

    let viewer: SkinViewer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let stopRotation: (() => void) | null = null;

    const initViewer = async () => {
        if (!canvasRef.current || !containerRef.current) return;

        try {
            const skinview3d = await import("skinview3d");

            const initialWidth = width || containerRef.current.clientWidth;
            const initialHeight = height || containerRef.current.clientHeight;

            const dpr = Math.min(window.devicePixelRatio, 1.5);

            viewer = new skinview3d.SkinViewer({
                canvas: canvasRef.current,
                width: initialWidth,
                height: initialHeight,
                devicePixelRatio: dpr
            } as any);

            viewerRef.current = viewer;

            viewer.camera.position.set(0, 0, 60);

            if (viewer.controls) {
                viewer.controls.enableZoom = true;
                viewer.controls.enableRotate = true;
            }
            
            setAnimation(viewer, skinview3d, animation);

            viewer.playerObject.rotation.y = Math.PI;
            viewer.autoRotate = true;
            viewer.autoRotateSpeed = 0.5;

            stopRotation = () => {
                if (viewer) {
                    viewer.autoRotate = false;
                }
            };
            canvasRef.current.addEventListener("mousedown", stopRotation);
            canvasRef.current.addEventListener("touchstart", stopRotation, { passive: true });

            loadTextures(viewer, capeUrl, skinUrl, minecraftName);

            resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                     if (viewer && !width && !height) {
                         const newWidth = entry.contentRect.width;
                         const newHeight = entry.contentRect.height;
                         if (newWidth > 0 && newHeight > 0) {
                            viewer.setSize(newWidth, newHeight);
                         }
                     }
                }
            });
            resizeObserver.observe(containerRef.current);
            
            setTimeout(() => setIsLoading(false), 500);

        } catch (error) {
            console.error("Failed to load skinview3d:", error);
            setIsLoading(false);
        }
    };

    initViewer();

    return () => {
      if (stopRotation && canvasRef.current) {
          canvasRef.current.removeEventListener("mousedown", stopRotation);
          canvasRef.current.removeEventListener("touchstart", stopRotation);
      }
      if (viewer) {
          try {
              viewer.dispose();
          } catch (e) { }
      }
      viewerRef.current = null;
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [hasLoaded]); 

  useEffect(() => {
    if (viewerRef.current) {
        setIsLoading(true);
        loadTextures(viewerRef.current, capeUrl, skinUrl, minecraftName);
        setTimeout(() => setIsLoading(false), 300);
    }
  }, [capeUrl, skinUrl, minecraftName]);

  useEffect(() => {
    if (viewerRef.current && width && height) {
        viewerRef.current.setSize(width, height);
    }
  }, [width, height]);
  
  useEffect(() => {
      if (viewerRef.current) {
          import("skinview3d").then(skinview3d => {
              if (viewerRef.current) {
                  setAnimation(viewerRef.current, skinview3d, animation);
              }
          });
      }
  }, [animation]);


  const setAnimation = (viewer: SkinViewer, skinview3d: any, animType: string) => {
      viewer.animation = null;
      
      switch (animType) {
          case "walk":
              viewer.animation = new skinview3d.WalkingAnimation();
              if (viewer.animation) {
                  (viewer.animation as any).speed = 0.5;
              }
              break;
          case "run":
              viewer.animation = new skinview3d.RunningAnimation();
              break;
          case "idle":
              viewer.animation = new skinview3d.IdleAnimation();
              break;
          case "none":
          default:
              viewer.animation = null;
              break;
      }
  };

  const loadTextures = (viewer: SkinViewer, cape: string | null | undefined, skin: string | undefined, name: string | undefined) => {
        const getProxiedUrl = (url: string | null | undefined) => {
            if (!url) return null;
            if (url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("/")) return url;
            return `/api/proxy?url=${encodeURIComponent(url)}`;
        };

        let finalSkinUrl = null;
        if (skin) {
            finalSkinUrl = getProxiedUrl(skin);
        } else if (name) {
             finalSkinUrl = `https://minotar.net/skin/${name}`;
        } else {
             finalSkinUrl = "https://minotar.net/skin/MHF_Steve";
        }

        if (finalSkinUrl) {
             viewer.loadSkin(finalSkinUrl);
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
          <div ref={containerRef} className="relative rounded-lg overflow-hidden flex items-center justify-center p-6 text-center bg-zinc-900" style={{ width: width || '100%', height: height || '100%' }}>
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
    <div ref={containerRef} className="relative overflow-hidden w-full h-full flex items-center justify-center cursor-grab" style={{ width: width ? width : '100%', height: height ? height : '100%' }}>
      {hasLoaded ? (
        <>
            <canvas ref={canvasRef} className={`outline-none transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} w-full h-full`} />
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                </div>
            )}
        </>
      ) : (
        <div className="w-full h-full bg-zinc-900/20 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-zinc-700/50 border-t-zinc-700 rounded-full animate-spin opacity-50" />
        </div>
      )}
    </div>
  );
}
