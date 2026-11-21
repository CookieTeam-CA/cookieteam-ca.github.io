"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Maximize, Minimize, RotateCcw } from "lucide-react";
import BackgroundPicker from "./BackgroundPicker";
import { Slider } from "radix-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cropRect, DEFAULT_FRAMING, MAX_ZOOM, panFraming, zoomFraming, type Framing } from "../lib/cape-compose";
import { useTranslations } from "../i18n/client";

const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map(value => Math.round(value).toString(16).padStart(2, "0")).join("")}`;

/** Alpha-weighted average colour of the picture, or null for a fully transparent one. */
function averageColour(image: CanvasImageSource, width: number, height: number): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(image, 0, 0, width, height, 0, 0, 32, 32);
  const { data } = context.getImageData(0, 0, 32, 32);
  let r = 0, g = 0, b = 0, a = 0;
  for (let i = 0; i < data.length; i += 4) { r += data[i] * data[i + 3]; g += data[i + 1] * data[i + 3]; b += data[i + 2] * data[i + 3]; a += data[i + 3]; }
  return a ? toHex(r / a, g / a, b / a) : null;
}
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
  const zoomId = useId();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [picking, setPicking] = useState(false);
  const suggested = useMemo(() => typeof document === "undefined" ? null : averageColour(image, width, height), [image, width, height]);

  /** Samples the source pixel under a click on the face preview. */
  function sample(event: React.PointerEvent<HTMLCanvasElement>) {
    const box = event.currentTarget.getBoundingClientRect(), rect = cropRect(width, height, framing);
    const x = rect.x + (event.clientX - box.left) / box.width * rect.width, y = rect.y + (event.clientY - box.top) / box.height * rect.height;
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const probe = document.createElement("canvas"); probe.width = probe.height = 1;
    const context = probe.getContext("2d", { willReadFrequently: true })!;
    context.drawImage(image, Math.floor(x), Math.floor(y), 1, 1, 0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    if (!a) return;
    onBackgroundChange(toHex(r, g, b));
    setPicking(false);
  }
  useEffect(() => {
    if (!picking) return;
    const cancel = (event: KeyboardEvent) => { if (event.key === "Escape") setPicking(false); };
    window.addEventListener("keydown", cancel);
    return () => window.removeEventListener("keydown", cancel);
  }, [picking]);
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

  return <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
    <canvas ref={canvas} tabIndex={disabled ? -1 : 0} role="img"
      aria-label={t("Cape front. Drag to move the picture, scroll or pinch to zoom. Arrow keys move, plus and minus zoom.")}
      className={cn("mx-auto aspect-5/8 w-45 shrink-0 touch-none rounded-lg border border-white/15 bg-[repeating-conic-gradient(#27272a_0_25%,#18181b_0_50%)] bg-size-[16px_16px] outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:mx-0", disabled ? "opacity-60" : picking ? "cursor-crosshair ring-2 ring-orange-400" : "cursor-grab active:cursor-grabbing", pixelArt && "[image-rendering:pixelated]")}
      onPointerDown={event => {
        if (disabled) return;
        if (picking) { sample(event); return; }
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
    <div className="flex min-w-0 flex-1 flex-col gap-5">
      <p className="text-sm leading-relaxed text-zinc-400">{t("Drag the picture to move it. Scroll or use the slider to zoom.")}</p>
      <div role="group" aria-label={t("Picture size")} className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
        {([["fill", Maximize, t("Fill cape")], ["fit", Minimize, t("Whole picture")]] as const).map(([value, Icon, label]) => <button key={value} type="button" aria-pressed={framing.fit === value} disabled={disabled} onClick={() => onChange({ ...DEFAULT_FRAMING, fit: value })}
          className={cn("flex h-9 min-w-0 items-center justify-center gap-2 rounded-md px-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50 motion-reduce:transition-none", framing.fit === value ? "bg-primary text-primary-foreground" : "text-zinc-300 hover:bg-white/5")}>
          <Icon className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">{label}</span>
        </button>)}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-zinc-300">
          <span id={zoomId}>{t("Zoom")}</span>
          <span className="tabular-nums text-zinc-500">{Math.round(framing.zoom * 100)} %</span>
        </div>
        <Slider.Root aria-labelledby={zoomId} min={1} max={MAX_ZOOM} step={0.01} value={[framing.zoom]} disabled={disabled} onValueChange={([value]) => onChange(zoomFraming(width, height, framing, value))} className="relative flex h-6 w-full touch-none items-center select-none data-disabled:opacity-50">
          <Slider.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-white/10"><Slider.Range className="absolute h-full rounded-full bg-orange-500" /></Slider.Track>
          <Slider.Thumb aria-label={t("Zoom")} className="block size-4 rounded-full border-2 border-orange-500 bg-white shadow outline-none transition-transform hover:scale-110 focus-visible:ring-4 focus-visible:ring-orange-400/40 motion-reduce:transition-none" />
        </Slider.Root>
      </div>
      {framing.fit === "fit" && <div className="flex flex-col gap-2">
        <span className="text-sm text-zinc-300">{t("Background colour")}</span>
        <BackgroundPicker value={background} onChange={onBackgroundChange} suggested={suggested} picking={picking} onPickingChange={setPicking} disabled={disabled} />
      </div>}
      <Button type="button" variant="outline" size="sm" className="self-start text-zinc-300" disabled={disabled || (framing.zoom === 1 && framing.x === 0.5 && framing.y === 0.5)} onClick={() => onChange({ ...DEFAULT_FRAMING, fit: framing.fit })}><RotateCcw aria-hidden="true" />{t("Reset position")}</Button>
    </div>
  </div>;
}
