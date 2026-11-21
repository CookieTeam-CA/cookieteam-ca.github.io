"use client";

import { useEffect, useRef } from "react";
import { Maximize, Minimize, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cropRect, DEFAULT_FRAMING, MAX_ZOOM, panFraming, zoomFraming, type Framing } from "../lib/cape-compose";
import { useTranslations } from "../i18n/client";

const DISPLAY_WIDTH = 180, DISPLAY_HEIGHT = 288;

interface Props {
  image: CanvasImageSource; width: number; height: number;
  framing: Framing; onChange: (framing: Framing) => void;
  pixelArt: boolean; background: string | null; onBackgroundChange: (value: string | null) => void;
  disabled?: boolean;
}

/** Shows the cape's outer face and lets the user move and zoom the picture inside it. */
export default function CapeFraming({ image, width, height, framing, onChange, pixelArt, background, onBackgroundChange, disabled = false }: Props) {
  const { t } = useTranslations();
  const canvas = useRef<HTMLCanvasElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const latest = useRef({ framing, width, height, onChange, disabled });
  useEffect(() => { latest.current = { framing, width, height, onChange, disabled }; });

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    element.width = DISPLAY_WIDTH * ratio; element.height = DISPLAY_HEIGHT * ratio;
    const context = element.getContext("2d")!;
    context.clearRect(0, 0, element.width, element.height);
    if (background) { context.fillStyle = background; context.fillRect(0, 0, element.width, element.height); }
    context.imageSmoothingEnabled = !pixelArt;
    context.imageSmoothingQuality = "high";
    const rect = cropRect(width, height, framing);
    const sx = Math.max(0, rect.x), sy = Math.max(0, rect.y), ex = Math.min(width, rect.x + rect.width), ey = Math.min(height, rect.y + rect.height);
    if (ex > sx && ey > sy) {
      const scale = element.width / rect.width;
      context.drawImage(image, sx, sy, ex - sx, ey - sy, (sx - rect.x) * scale, (sy - rect.y) * scale, (ex - sx) * scale, (ey - sy) * scale);
    }
  }, [image, width, height, framing, pixelArt, background]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      const { framing, width, height, onChange, disabled } = latest.current;
      if (disabled) return;
      event.preventDefault();
      onChange(zoomFraming(width, height, framing, framing.zoom * Math.exp(-event.deltaY * 0.002)));
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  /** Converts a drag in CSS pixels into source pixels; moving the picture moves the crop the other way. */
  function drag(dx: number, dy: number) {
    const element = canvas.current;
    if (!element) return;
    const rect = cropRect(width, height, framing);
    const perPixel = rect.width / element.clientWidth;
    onChange(panFraming(width, height, framing, -dx * perPixel, -dy * perPixel));
  }

  const distance = () => { const [a, b] = [...pointers.current.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const step = cropRect(width, height, framing).width * 0.04;

  return <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
    <canvas ref={canvas} tabIndex={disabled ? -1 : 0} role="img"
      aria-label={t("Cape front. Drag to move the picture, scroll or pinch to zoom. Arrow keys move, plus and minus zoom.")}
      className={cn("mx-auto aspect-5/8 w-45 shrink-0 touch-none rounded-lg border border-white/15 bg-[repeating-conic-gradient(#27272a_0_25%,#18181b_0_50%)] bg-size-[16px_16px] outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:mx-0", disabled ? "opacity-60" : "cursor-grab active:cursor-grabbing", pixelArt && "[image-rendering:pixelated]")}
      onPointerDown={event => {
        if (disabled) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.current.size === 2) pinch.current = { distance: distance(), zoom: framing.zoom };
      }}
      onPointerMove={event => {
        const previous = pointers.current.get(event.pointerId);
        if (!previous || disabled) return;
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.current.size === 2 && pinch.current) onChange(zoomFraming(width, height, framing, pinch.current.zoom * distance() / Math.max(1, pinch.current.distance)));
        else if (pointers.current.size === 1) drag(event.clientX - previous.x, event.clientY - previous.y);
      }}
      onPointerUp={event => { pointers.current.delete(event.pointerId); if (pointers.current.size < 2) pinch.current = null; }}
      onPointerCancel={event => { pointers.current.delete(event.pointerId); pinch.current = null; }}
      onKeyDown={event => {
        if (disabled) return;
        const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        if (moves[event.key]) { event.preventDefault(); onChange(panFraming(width, height, framing, ...moves[event.key])); }
        else if (event.key === "+" || event.key === "=") { event.preventDefault(); onChange(zoomFraming(width, height, framing, framing.zoom * 1.15)); }
        else if (event.key === "-") { event.preventDefault(); onChange(zoomFraming(width, height, framing, framing.zoom / 1.15)); }
      }} />
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <p className="text-sm leading-relaxed text-zinc-400">{t("This is the back of your cape. Drag the picture to move it and zoom to choose the part you want.")}</p>
      <div role="group" aria-label={t("Picture size")} className="grid grid-cols-2 gap-2">
        <Button type="button" variant={framing.fit === "fill" ? "default" : "outline"} aria-pressed={framing.fit === "fill"} disabled={disabled} onClick={() => onChange({ ...DEFAULT_FRAMING, fit: "fill" })}><Maximize aria-hidden="true" />{t("Fill cape")}</Button>
        <Button type="button" variant={framing.fit === "fit" ? "default" : "outline"} aria-pressed={framing.fit === "fit"} disabled={disabled} onClick={() => onChange({ ...DEFAULT_FRAMING, fit: "fit" })}><Minimize aria-hidden="true" />{t("Show whole picture")}</Button>
      </div>
      <label className="flex flex-col gap-2 text-sm text-zinc-300">{t("Zoom")}
        <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={framing.zoom} disabled={disabled} onChange={event => onChange(zoomFraming(width, height, framing, Number(event.target.value)))} className="accent-orange-500" />
      </label>
      {framing.fit === "fit" && <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
        <label className="flex items-center gap-2"><input type="checkbox" checked={background !== null} disabled={disabled} onChange={event => onBackgroundChange(event.target.checked ? "#1f1f23" : null)} className="size-4 accent-orange-500" />{t("Background colour")}</label>
        {background !== null && <input type="color" aria-label={t("Background colour")} value={background} disabled={disabled} onChange={event => onBackgroundChange(event.target.value)} className="h-9 w-14 cursor-pointer rounded border border-white/15 bg-transparent" />}
      </div>}
      <Button type="button" variant="ghost" className="self-start text-zinc-400" disabled={disabled || (framing.zoom === 1 && framing.x === 0.5 && framing.y === 0.5)} onClick={() => onChange({ ...DEFAULT_FRAMING, fit: framing.fit })}><RotateCcw aria-hidden="true" />{t("Reset position")}</Button>
    </div>
  </div>;
}
