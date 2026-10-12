"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import type { SkinViewer } from "skinview3d";
import { disposeSkinViewer } from "../../lib/dispose-skin-viewer";

export default function SkinPreview({ identifier, username, interactive = false }: { identifier: string; username: string; interactive?: boolean }) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);
  const renderRef = useRef<(() => void) | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    let cancelled = false;
    let started = false;
    let visible = false;
    let viewer: SkinViewer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let frame: number | undefined;
    const render = () => {
      if (cancelled || !visible || document.hidden || !viewer || viewer.disposed || frame !== undefined) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        if (!cancelled && visible && !document.hidden && viewer && !viewer.disposed && !viewer.renderer.getContext().isContextLost()) {
          // The library's normal draw loop updates OrbitControls before rendering.
          // This also establishes the initial camera pose for static podiums.
          viewer.controls.update();
          viewer.render();
        }
      });
    };
    renderRef.current = render;

    async function initialize() {
      try {
        const { SkinViewer } = await import("skinview3d");
        if (cancelled || !container || !canvas) return;
        if (!visible || document.hidden) { started = false; return; }
        // Preserve the last frame: a continuously redrawn viewer can clear its
        // drawing buffer after compositing, but an on-demand viewer must keep it.
        viewer = new SkinViewer({ canvas, width: container.clientWidth, height: container.clientHeight, pixelRatio: Math.min(window.devicePixelRatio, 1.5), zoom: 0.85, renderPaused: true, preserveDrawingBuffer: true, enableControls: interactive });
        viewerRef.current = viewer;
        viewer.controls.enableRotate = interactive;
        viewer.controls.enableZoom = false;
        viewer.controls.enablePan = false;
        viewer.controls.addEventListener("change", render);
        viewer.playerObject.rotation.y = -0.35;
        resizeObserver = new ResizeObserver(() => {
          if (viewer && container.clientWidth && container.clientHeight) {
            if (viewer.width !== container.clientWidth || viewer.height !== container.clientHeight) viewer.setSize(container.clientWidth, container.clientHeight);
            render();
          }
        });
        resizeObserver.observe(container);
        await viewer.loadSkin(`https://minotar.net/skin/${identifier}`);
        if (cancelled) viewer.resetSkin();
        else { setLoaded(true); render(); }
      } catch {
        if (!cancelled) {
          resizeObserver?.disconnect();
          disposeSkinViewer(viewer);
          viewer = null;
          viewerRef.current = null;
          setFailed(true);
        }
      }
    }

    const activate = () => {
      render();
      if (visible && !document.hidden && !started) {
        started = true;
        void initialize();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      activate();
    }, { rootMargin: "50px" });
    observer.observe(container);
    document.addEventListener("visibilitychange", activate);
    canvas.addEventListener("webglcontextrestored", render);
    return () => {
      cancelled = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", activate);
      canvas.removeEventListener("webglcontextrestored", render);
      if (frame !== undefined) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      viewer?.controls.removeEventListener("change", render);
      disposeSkinViewer(viewer);
      viewerRef.current = null;
      renderRef.current = null;
    };
  }, [identifier, interactive]);

  return <span ref={containerRef} className={`stats-player-visual stats-skin${interactive ? " stats-skin-interactive" : ""}`}
    role={interactive ? "group" : "img"} aria-label={failed ? `Skin von ${username} nicht verfügbar` : `3D-Minecraft-Skin von ${username}`}
    tabIndex={interactive && !failed ? 0 : undefined}
    title={interactive ? "Skin drehen: ziehen oder Pfeiltasten verwenden" : undefined}
    onKeyDown={event => {
      if (!interactive || !viewerRef.current || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      viewerRef.current.playerObject.rotation.y += event.key === "ArrowLeft" ? -0.25 : 0.25;
      renderRef.current?.();
    }}>
    {!loaded && !failed && <span className="stats-skeleton stats-image-skeleton" aria-hidden="true" />}
    {failed ? <UserRound className="stats-image-fallback" aria-hidden="true" /> : <canvas ref={canvasRef} aria-hidden="true" className={loaded ? "is-loaded" : ""} />}
  </span>;
}
