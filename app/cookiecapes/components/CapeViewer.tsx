"use client";

import { useTranslations } from "@/app/cookiecapes/i18n/client";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { hasElytraPixels } from "../lib/elytra";
import type { SkinViewer } from "skinview3d";
import { disposeSkinViewer } from "../../lib/dispose-skin-viewer";
import { useElementActive, useReducedMotion } from "../../lib/visibility";
import { loadTextureImage } from "../lib/texture-cache";
import { applyCapeCanvas, playCapeManifest, type CapeManifestPlayer } from "../lib/animation-viewer";

interface CapeViewerProps {
    capeFrame?: { canvas: HTMLCanvasElement; revision: number };
    animationManifest?: string;
    capeUrl?: string | null;
    allowElytraSwitch?: boolean;
    skinUrl?: string;
    minecraftName?: string;
    width?: number;
    height?: number;
    animation?: "idle" | "walk" | "run" | "none";
    animateOnHover?: boolean;
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
        const image = await loadTextureImage(url);
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
    capeFrame,
    animationManifest,
    capeUrl,
    skinUrl,
    minecraftName,
    width,
    height,
    animation = "idle",
    allowElytraSwitch = false,
    animateOnHover = false
}: CapeViewerProps) {
    const { t } = useTranslations();
    const canvasHostRef = useRef<HTMLDivElement>(null);
    const renderRef = useRef<(() => void) | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<SkinViewer | null>(null);
    const manifestPlayer = useRef<CapeManifestPlayer | null>(null);
    const manifestPlaying = useRef(false);
    const active = useElementActive(containerRef);
    const reducedMotion = useReducedMotion();
    const [motionPaused, setMotionPaused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const motionEnabled = !reducedMotion && !motionPaused && (!animateOnHover || hovered || focused);
    const optionsRef = useRef({ capeUrl, skinUrl, minecraftName, width, height, animation });
    const [viewerError, setViewerError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [viewerReady, setViewerReady] = useState(false);
    const [textureError, setTextureError] = useState(false);
    const [retry, setRetry] = useState(0);
    const [equipment, setEquipment] = useState({ url: capeUrl, available: false, elytra: false });

    useEffect(() => { optionsRef.current = { capeUrl, skinUrl, minecraftName, width, height, animation }; }, [capeUrl, skinUrl, minecraftName, width, height, animation]);

    useEffect(() => {
        if (!active) return;

        const host = canvasHostRef.current;
        const container = containerRef.current;
        if (!host || !container) return;
        // Each effect owns a fresh canvas; a forcibly lost context cannot be reused.
        const canvas = document.createElement("canvas");
        canvas.className = "absolute inset-0 outline-none";
        host.appendChild(canvas);
        let cancelled = false;
        setIsLoading(true);
        setViewerError(false);
        setViewerReady(false);

        let viewer: SkinViewer | null = null;
        let resizeObserver: ResizeObserver | null = null;
        let stopRotation: (() => void) | null = null;
        const contextLost = (event: Event) => {
            event.preventDefault();
            if (cancelled) return;
            if (viewer) viewer.renderPaused = true;
            setViewerError(true);
            setIsLoading(false);
        };
        canvas.addEventListener("webglcontextlost", contextLost);
        let frame: number | undefined;
        const render = () => {
            if (cancelled || !viewer || viewer.disposed || !viewer.renderPaused || frame !== undefined) return;
            frame = requestAnimationFrame(() => {
                frame = undefined;
                if (!cancelled && viewer && !viewer.disposed && !viewer.renderer.getContext().isContextLost()) {
                    viewer.controls.update();
                    viewer.render();
                }
            });
        };
        renderRef.current = render;

        const initViewer = async () => {
            try {
                const skinview3d = await import("skinview3d");
                if (cancelled) return;

                const { width, height } = optionsRef.current;
                const initialWidth = width || container.clientWidth;
                const initialHeight = height || container.clientHeight;

                const dpr = Math.min(window.devicePixelRatio, animateOnHover ? 1 : 1.5);

                viewer = new skinview3d.SkinViewer({
                    canvas,
                    width: initialWidth,
                    height: initialHeight,
                    pixelRatio: dpr,
                    renderPaused: true,
                    preserveDrawingBuffer: true,
                });
                viewer.fxaaPass.material.fragmentShader = viewer.fxaaPass.material.fragmentShader.replaceAll("-100.0", "-16.0");
                viewerRef.current = viewer;
                viewer.controls.addEventListener("change", render);

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
                            if (newWidth > 0 && newHeight > 0 && (viewer.width !== newWidth || viewer.height !== newHeight)) {
                                viewer.setSize(newWidth, newHeight);
                                render();
                            }
                        }
                    }
                });
                resizeObserver.observe(container);
                setViewerReady(true);

            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to load skinview3d:", error);
                    setViewerError(true);
                    setIsLoading(false);
                }
            }
        };

        // Skip GPU allocation for cards passing through during a fast scroll.
        const timer = window.setTimeout(initViewer, 120);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            if (frame !== undefined) cancelAnimationFrame(frame);
            canvas.removeEventListener("webglcontextlost", contextLost);
            if (stopRotation) {
                canvas.removeEventListener("mousedown", stopRotation);
                canvas.removeEventListener("touchstart", stopRotation);
            }
            if (viewer) {
                viewer.controls.removeEventListener("change", render);
                try {
                    disposeSkinViewer(viewer);
                } catch { }
            }
            viewerRef.current = null;
            renderRef.current = null;
            canvas.remove();
            canvas.width = 0;
            canvas.height = 0;
            setViewerReady(false);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [active, retry, animateOnHover]);

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
                renderRef.current?.();
            }).catch(() => {
                if (!cancelled && !viewer.disposed) setTextureError(true);
            }).finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        }
        return () => { cancelled = true; };
    }, [viewerReady, active, capeUrl, skinUrl, minecraftName, allowElytraSwitch]);

    useEffect(() => {
        if (viewerRef.current && width && height) {
            viewerRef.current.setSize(width, height);
            renderRef.current?.();
        }
    }, [width, height]);

    useEffect(() => {
        const viewer = viewerRef.current;
        if (viewer && capeFrame && !isLoading && viewerReady && active) {
            applyCapeCanvas(viewer, capeFrame.canvas);
            renderRef.current?.();
        }
    }, [capeFrame, isLoading, viewerReady, active]);

    useEffect(() => {
        const viewer = viewerRef.current;
        if (!animationManifest || !viewer || !viewerReady || isLoading || !active) return;
        const player = playCapeManifest(viewer, animationManifest, () => renderRef.current?.());
        manifestPlayer.current = player;
        player.setPlaying(manifestPlaying.current);
        return () => { player.dispose(); manifestPlayer.current = null; };
    }, [animationManifest, viewerReady, isLoading, active]);

    useEffect(() => {
        manifestPlaying.current = motionEnabled;
        manifestPlayer.current?.setPlaying(motionEnabled);
    }, [motionEnabled]);

    useEffect(() => {
        const viewer = viewerRef.current;
        let cancelled = false;
        if (viewer) {
            import("skinview3d").then(skinview3d => {
                if (!cancelled && !viewer.disposed) {
                    setAnimation(viewer, skinview3d, motionEnabled ? animation : "none");
                    viewer.autoRotate = motionEnabled;
                    viewer.renderPaused = !motionEnabled || isLoading;
                    if (!isLoading) renderRef.current?.();
                }
            });
        }
        return () => { cancelled = true; };
    }, [animation, motionEnabled, viewerReady, isLoading]);


    return (
        <div ref={containerRef} className="relative overflow-hidden w-full h-full flex items-center justify-center cursor-grab" style={{ width: width ? width : '100%', height: height ? height : '100%' }}
            tabIndex={animateOnHover ? 0 : undefined} role="group"
            aria-label={t("3D preview of {name}", { name: minecraftName || "Minecraft" })}
            onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
            <div ref={canvasHostRef} className={`absolute inset-0 ${!active || isLoading || textureError || viewerError ? "invisible" : ""}`} />
            {animationManifest && active && <Button size="sm" variant="outline" className="absolute top-4 right-4 z-30" onClick={() => setMotionPaused(value => !value)}>{motionPaused ? "Abspielen" : "Pause"}</Button>}
            {(!active || isLoading || !viewerReady) && !viewerError && !textureError && (
                <div className="absolute inset-0 flex items-center justify-center" role="status" aria-label={t("Loading capes...")}>
                    <div className={`size-6 border-2 border-zinc-700/50 border-t-zinc-700 rounded-full opacity-50 ${active ? "animate-spin" : ""}`} />
                </div>
            )}
            {active ? (
                <>
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
                                renderRef.current?.();
                            }}>
                            <span>Elytra</span>
                            <span aria-hidden="true" className={`relative h-5 w-9 rounded-full transition-colors ${equipment.elytra ? "bg-orange-500" : "bg-zinc-600"}`}>
                                <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform ${equipment.elytra ? "translate-x-4" : "translate-x-0"}`} />
                            </span>
                        </button>
                    )}
                    {(textureError || viewerError) && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                        <p className="text-sm text-zinc-400">{t("The 3D preview could not be loaded.")}</p>
                        <Button onClick={() => setRetry(value => value + 1)} size="sm">{t("Try again")}</Button>
                    </div>}

                </>
            ) : null}
        </div>
    );
}
