"use client";

import { useEffect, useRef, useState } from "react";
import type { SkinViewer } from "skinview3d";
import { disposeSkinViewer } from "../../lib/dispose-skin-viewer";

interface CapeViewerProps {
  capeUrl?: string | null;
  skinUrl?: string;
  minecraftName?: string;
  width?: number;
  height?: number;
  animation?: "idle" | "walk" | "run" | "none";
}

function setAnimation(viewer: SkinViewer, skinview3d: typeof import("skinview3d"), animType: string) {
      viewer.animation = null;

      switch (animType) {
          case "walk":
              viewer.animation = new skinview3d.WalkingAnimation();
              if (viewer.animation) {
                  viewer.animation.speed = 0.5;
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
}

function loadTextures(viewer: SkinViewer, cape: string | null | undefined, skin: string | undefined, name: string | undefined, isCurrent: () => boolean) {
        const getProxiedUrl = (url: string | null | undefined) => {
            if (!url) return null;
            if (url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("/")) return url;
            return `/api/proxy?url=${encodeURIComponent(url)}`;
      }

        let finalSkinUrl = null;
        if (skin) {
            finalSkinUrl = getProxiedUrl(skin);
        } else if (name) {
             finalSkinUrl = `https://minotar.net/skin/${name}`;
        } else {
             finalSkinUrl = "https://minotar.net/skin/MHF_Steve";
        }

        // A cape is optional; a missing image must not prevent the player preview.
        const capeLoad = (async () => {
            if (cape) await viewer.loadCape(cape);
            else viewer.loadCape(null);
        })().catch(() => {
            if (isCurrent()) viewer.loadCape(null);
        });
        return Promise.all([finalSkinUrl ? viewer.loadSkin(finalSkinUrl) : viewer.loadSkin(null), capeLoad]);
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
  const visibleRef = useRef(false);
  const texturesReadyRef = useRef(false);
  const optionsRef = useRef({ capeUrl, skinUrl, minecraftName, width, height, animation });
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const [textureError, setTextureError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => { optionsRef.current = { capeUrl, skinUrl, minecraftName, width, height, animation }; }, [capeUrl, skinUrl, minecraftName, width, height, animation]);

  useEffect(() => {
    const sync = () => {
      const active = visibleRef.current && !document.hidden;
      if (active && !hasLoaded) { setHasLoaded(true); setIsLoading(true); }
      if (viewerRef.current) viewerRef.current.renderPaused = !active || !texturesReadyRef.current;
    };
    const observer = new IntersectionObserver(
        (entries) => {
            visibleRef.current = entries[0].isIntersecting;
            sync();
        },
        { rootMargin: "50px" }
    );

    if (containerRef.current) {
        observer.observe(containerRef.current);
    }

    document.addEventListener("visibilitychange", sync);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, [hasLoaded]);

  useEffect(() => {
    if (!hasLoaded) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    let cancelled = false;

    let viewer: SkinViewer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let stopRotation: (() => void) | null = null;

    const initViewer = async () => {
        if (!canvasRef.current || !containerRef.current) return;

        try {
            const skinview3d = await import("skinview3d");
            if (cancelled) return;

            const { width, height, animation } = optionsRef.current;
            const initialWidth = width || container.clientWidth;
            const initialHeight = height || container.clientHeight;

            const dpr = Math.min(window.devicePixelRatio, 1.5);

            viewer = new skinview3d.SkinViewer({
                canvas,
                width: initialWidth,
                height: initialHeight,
                pixelRatio: dpr,
                renderPaused: true,
            });
            setWebglSupported(true);

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
            canvas.addEventListener("mousedown", stopRotation);
            canvas.addEventListener("touchstart", stopRotation, { passive: true });

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
            resizeObserver.observe(container);
            setViewerReady(true);

        } catch (error) {
            if (!cancelled) {
                console.error("Failed to load skinview3d:", error);
                if (!viewer) setWebglSupported(false);
                setIsLoading(false);
            }
        }
    };

    initViewer();

    return () => {
      cancelled = true;
      if (stopRotation) {
          canvas.removeEventListener("mousedown", stopRotation);
          canvas.removeEventListener("touchstart", stopRotation);
      }
      if (viewer) {
          try {
              disposeSkinViewer(viewer);
          } catch { }
      }
      viewerRef.current = null;
      texturesReadyRef.current = false;
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [hasLoaded]);

  useEffect(() => {
    const viewer = viewerRef.current;
    let cancelled = false;
    if (viewer) {
        texturesReadyRef.current = false;
        viewer.renderPaused = true;
        setIsLoading(true);
        setTextureError(false);
        void loadTextures(viewer, capeUrl, skinUrl, minecraftName, () => !cancelled && !viewer.disposed).then(() => {
            if (cancelled || viewer.disposed) return;
            texturesReadyRef.current = true;
            viewer.renderPaused = !visibleRef.current || document.hidden;
        }).catch(() => {
            if (!cancelled && !viewer.disposed) setTextureError(true);
        }).finally(() => {
            if (viewer.disposed) { viewer.resetSkin(); viewer.resetCape(); }
            if (!cancelled) setIsLoading(false);
        });
    }
    return () => { cancelled = true; };
  }, [viewerReady, capeUrl, skinUrl, minecraftName, retry]);

  useEffect(() => {
    if (viewerRef.current && width && height) {
        viewerRef.current.setSize(width, height);
    }
  }, [width, height]);

  useEffect(() => {
      const viewer = viewerRef.current;
      let cancelled = false;
      if (viewer) {
          import("skinview3d").then(skinview3d => {
              if (!cancelled && !viewer.disposed) {
                  setAnimation(viewer, skinview3d, animation);
              }
          });
      }
      return () => { cancelled = true; };
  }, [animation]);


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
            <canvas ref={canvasRef} className={`outline-none transition-opacity duration-300 ${isLoading || textureError ? 'opacity-0' : 'opacity-100'} w-full h-full`} />
            {textureError && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                <p className="text-sm text-zinc-400">3D-Vorschau konnte nicht geladen werden.</p>
                <button onClick={() => setRetry(value => value + 1)} className="rounded-lg bg-orange-500 px-4 py-2 font-bold">Erneut versuchen</button>
            </div>}
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
