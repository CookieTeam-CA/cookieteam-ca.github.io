"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "../i18n/client";

interface StaticPreviewProps {
    src: string;
    alt: string;
    viewerFallback?: { capeUrl: string | null; minecraftName: string };
}

export default function StaticPreview({ src, alt, viewerFallback }: StaticPreviewProps) {
    const { t } = useTranslations();
    const imageRef = useRef<HTMLImageElement>(null);
    const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const [failedViewerSrc, setFailedViewerSrc] = useState<string | null>(null);
    const [Viewer, setViewer] = useState<typeof import("./CapeViewer").default | null>(null);
    const failed = failedSrc === src;
    const loaded = loadedSrc === src;
    const hasViewerFallback = !!viewerFallback;
    const errorMessage = t("Cape couldn't load");

    useEffect(() => {
        const image = imageRef.current;
        if (image?.complete) {
            // SSR images can finish before hydration attaches load/error handlers.
            if (image.naturalWidth === 0) setFailedSrc(src);
            else setLoadedSrc(src);
        }
    }, [src, failed]);

    useEffect(() => {
        if (!failed || !hasViewerFallback || Viewer || failedViewerSrc === src) return;
        let cancelled = false;
        import("./CapeViewer").then(module => {
            if (!cancelled) setViewer(() => module.default);
        }).catch(() => {
            if (!cancelled) setFailedViewerSrc(src);
        });
        return () => { cancelled = true; };
    }, [failed, hasViewerFallback, Viewer, failedViewerSrc, src]);

    if (failed) {
        if (viewerFallback && Viewer) return <Viewer {...viewerFallback} animation="none" terminalErrorMessage={errorMessage} />;
        return <p role="status" className="p-4 text-center text-sm text-zinc-400">{viewerFallback && failedViewerSrc !== src ? t("Loading capes...") : errorMessage}</p>;
    }

    return (
        <div className="relative h-full w-full">
            {/* Native loading preserves the image route's browser/CDN cache policy. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                ref={imageRef}
                src={src}
                alt={alt}
                width={384}
                height={512}
                loading="lazy"
                decoding="async"
                className={`h-full w-full object-contain${loaded ? "" : " opacity-0"}`}
                style={{ imageRendering: "pixelated" }}
                onLoad={() => setLoadedSrc(src)}
                onError={() => setFailedSrc(src)}
            />
            {!loaded && <div className="pointer-events-none absolute inset-0 flex items-center justify-center" role="status" aria-label={t("Loading capes...")}>
                <div className="size-6 animate-spin rounded-full border-2 border-zinc-700/50 border-t-zinc-700 opacity-50 motion-reduce:animate-none" />
            </div>}
        </div>
    );
}
