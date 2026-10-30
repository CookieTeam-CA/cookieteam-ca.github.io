"use client";

import { useTranslations } from "@/app/cookiecapes/i18n/client";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { hasElytraPixels } from "../lib/elytra";
import type { SkinViewer } from "skinview3d";
import { disposeSkinViewer } from "../../lib/dispose-skin-viewer";
import { useElementActive, useReducedMotion } from "../../lib/visibility";

interface CapeViewerProps {
    capeUrl?: string | null;
    allowElytraSwitch?: boolean;
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

export function loadTextures(viewer: SkinViewer, cape: string | null | undefined, skin: string | undefined, name: string | undefined, isCurrent: () => boolean) {
    const load = async (url: string, apply: (image: HTMLImageElement) => void) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = url;
        await image.decode();
        if (isCurrent()) apply(image);
    };
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
        if (cape) await load(cape, image => viewer.loadCape(image));
        else if (isCurrent()) viewer.loadCape(null);
    })().catch(() => {
        if (isCurrent()) viewer.loadCape(null);
    });
    return Promise.all([finalSkinUrl ? load(finalSkinUrl, image => viewer.loadSkin(image)) : undefined, capeLoad]);
}


export default function CapeViewer({
    capeUrl,
    skinUrl,
    minecraftName,
    width,
    height,
    animation = "idle",
    allowElytraSwitch = false
}: CapeViewerProps) {
    const { t } = useTranslations();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<SkinViewer | null>(null);
    const active = useElementActive(containerRef);
    const reducedMotion = useReducedMotion();
    const [motionPaused, setMotionPaused] = useState(false);
    const motionEnabled = !reducedMotion && !motionPaused;
    const optionsRef = useRef({ capeUrl, skinUrl, minecraftName, width, height, animation });
    const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [viewerReady, setViewerReady] = useState(false);
    const [textureError, setTextureError] = useState(false);
    const [retry, setRetry] = useState(0);
    const [equipment, setEquipment] = useState({ url: capeUrl, available: false, elytra: false });

    useEffect(() => { optionsRef.current = { capeUrl, skinUrl, minecraftName, width, height, animation }; }, [capeUrl, skinUrl, minecraftName, width, height, animation]);

    useEffect(() => {
        if (!active) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        let cancelled = false;
        setIsLoading(true);

        let viewer: SkinViewer | null = null;
        let resizeObserver: ResizeObserver | null = null;
        let stopRotation: (() => void) | null = null;

        const initViewer = async () => {
            if (!canvasRef.current || !containerRef.current) return;

            try {
                const skinview3d = await import("skinview3d");
                if (cancelled) return;

                const { width, height } = optionsRef.current;
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
                viewer.fxaaPass.material.fragmentShader = viewer.fxaaPass.material.fragmentShader.replaceAll("-100.0", "-16.0");
                setWebglSupported(true);

                viewerRef.current = viewer;

                viewer.camera.position.set(0, 0, 60);

                if (viewer.controls) {
                    viewer.controls.enableZoom = true;
                    viewer.controls.enableRotate = true;
                }

                setAnimation(viewer, skinview3d, "none");

                viewer.playerObject.rotation.y = Math.PI;
                viewer.autoRotate = false;
                viewer.autoRotateSpeed = 0.5;

                stopRotation = () => {
                    setMotionPaused(true);
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
            setViewerReady(false);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [active]);

    useEffect(() => {
        const viewer = viewerRef.current;
        let cancelled = false;
        if (viewer) {
            viewer.renderPaused = true;
            setIsLoading(true);
            setTextureError(false);
            void loadTextures(viewer, capeUrl, skinUrl, minecraftName, () => !cancelled && !viewer.disposed).then(() => {
                if (cancelled || viewer.disposed) return;
                let available = false;
                if (allowElytraSwitch && capeUrl && viewer.playerObject.cape.map) {
                    try {
                        const canvas = viewer.capeCanvas;
                        const pixels = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height);
                        available = !!pixels && hasElytraPixels(pixels);
                    } catch { /* Keep cape view if the texture cannot be inspected. */ }
                }
                setEquipment({ url: capeUrl, available, elytra: false });
                viewer.renderPaused = !active;
            }).catch(() => {
                if (!cancelled && !viewer.disposed) setTextureError(true);
            }).finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        }
        return () => { cancelled = true; };
    }, [viewerReady, active, capeUrl, skinUrl, minecraftName, retry, allowElytraSwitch]);

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
                    setAnimation(viewer, skinview3d, motionEnabled ? animation : "none");
                    viewer.autoRotate = motionEnabled;
                }
            });
        }
        return () => { cancelled = true; };
    }, [animation, motionEnabled, viewerReady]);


    if (webglSupported === false) {
        return (
            <div ref={containerRef} className="relative rounded-lg overflow-hidden flex items-center justify-center p-6 text-center bg-zinc-900" style={{ width: width || '100%', height: height || '100%' }}>
                <div className="flex flex-col items-center gap-4">
                    <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-white font-bold">{t("3D preview unavailable")}</p>
                    <p className="text-sm text-zinc-400">{t("Your browser does not support WebGL.")}</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative overflow-hidden w-full h-full flex items-center justify-center cursor-grab" style={{ width: width ? width : '100%', height: height ? height : '100%' }}>
            {active ? (
                <>
                    <canvas ref={canvasRef} className={`outline-none transition-opacity duration-300 ${isLoading || textureError ? 'opacity-0' : 'opacity-100'} w-full h-full`} />
                    {allowElytraSwitch && equipment.url === capeUrl && equipment.available && !isLoading && !textureError && (
                        <button type="button" role="switch" className="absolute bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-zinc-950/90 px-3 py-2 text-sm font-medium text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                            aria-checked={equipment.elytra}
                            aria-label={t("Elytra view")}
                            onClick={() => {
                                const viewer = viewerRef.current;
                                if (!viewer || viewer.disposed) return;
                                const elytra = !equipment.elytra;
                                viewer.playerObject.backEquipment = elytra ? "elytra" : "cape";
                                setEquipment({ ...equipment, elytra });
                            }}>
                            <span>Elytra</span>
                            <span aria-hidden="true" className={`relative h-5 w-9 rounded-full transition-colors ${equipment.elytra ? "bg-orange-500" : "bg-zinc-600"}`}>
                                <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform ${equipment.elytra ? "translate-x-4" : "translate-x-0"}`} />
                            </span>
                        </button>
                    )}
                    {textureError && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                        <p className="text-sm text-zinc-400">{t("The 3D preview could not be loaded.")}</p>
                        <Button onClick={() => setRetry(value => value + 1)} size="sm">{t("Try again")}</Button>
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
