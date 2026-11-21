"use client";

import { useRef, useState } from "react";
import { Ban, Pipette, Plus, Sparkles } from "lucide-react";
import { Popover, Slider } from "radix-ui";
import { cn } from "@/lib/utils";
import { useTranslations } from "../i18n/client";

const SWATCHES = ["#18181b", "#ffffff", "#f97316", "#ef4444", "#facc15", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];

type Hsv = { h: number; s: number; v: number };
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function hexToHsv(hex: string): Hsv {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), delta = max - Math.min(r, g, b);
  const h = !delta ? 0 : max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return { h: (h * 60 + 360) % 360, s: max ? delta / max : 0, v: max };
}
export function hsvToHex({ h, s, v }: Hsv): string {
  const channel = (n: number) => { const k = (n + h / 60) % 6; return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255); };
  return `#${[5, 3, 1].map(n => channel(n).toString(16).padStart(2, "0")).join("")}`;
}

interface Props {
  value: string | null; onChange: (value: string | null) => void;
  suggested: string | null; picking: boolean; onPickingChange: (value: boolean) => void; disabled?: boolean;
}

function Swatch({ colour, selected, label, disabled, onClick, children }: { colour?: string; selected: boolean; label: string; disabled?: boolean; onClick?: () => void; children?: React.ReactNode }) {
  return <button type="button" role="radio" aria-checked={selected} aria-label={label} title={label} disabled={disabled} onClick={onClick}
    className={cn("relative flex size-8 shrink-0 items-center justify-center rounded-full border outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50 motion-reduce:transition-none", selected ? "border-white ring-2 ring-orange-400 ring-offset-2 ring-offset-zinc-950" : "border-white/20")}
    style={colour ? { backgroundColor: colour } : undefined}>{children}</button>;
}

/** Background swatches: none, the picture's own colour, presets and a custom colour with a pipette. */
export default function BackgroundPicker({ value, onChange, suggested, picking, onPickingChange, disabled = false }: Props) {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value ?? suggested ?? "#f97316"));
  const [draft, setDraft] = useState("");
  const field = useRef<HTMLDivElement>(null);
  const custom = value !== null && value !== suggested && !SWATCHES.includes(value);
  const hex = hsvToHex(hsv);

  function apply(next: Hsv) { setHsv(next); setDraft(""); onChange(hsvToHex(next)); }
  function pickField(event: React.PointerEvent<HTMLDivElement>) {
    const box = field.current!.getBoundingClientRect();
    apply({ h: hsv.h, s: clamp((event.clientX - box.left) / box.width), v: clamp(1 - (event.clientY - box.top) / box.height) });
  }

  return <div role="radiogroup" aria-label={t("Background colour")} className="flex flex-wrap items-center gap-2">
    <Swatch selected={value === null} label={t("No background")} disabled={disabled} onClick={() => onChange(null)}><Ban className="size-4 text-zinc-400" aria-hidden="true" /></Swatch>
    {suggested && <Swatch colour={suggested} selected={value === suggested} label={t("Colour of your picture")} disabled={disabled} onClick={() => onChange(suggested)}>
      <Sparkles className="size-3.5 text-white mix-blend-difference" aria-hidden="true" />
    </Swatch>}
    <span aria-hidden="true" className="mx-0.5 h-6 w-px bg-white/10" />
    {SWATCHES.map(colour => <Swatch key={colour} colour={colour} selected={value === colour} label={colour} disabled={disabled} onClick={() => onChange(colour)} />)}
    <span aria-hidden="true" className="mx-0.5 h-6 w-px bg-white/10" />
    <Popover.Root open={open} onOpenChange={next => { setOpen(next); if (next) setHsv(hexToHsv(value ?? suggested ?? "#f97316")); }}>
      <Popover.Trigger asChild>
        <button type="button" role="radio" aria-checked={custom} aria-label={t("Custom colour")} title={t("Custom colour")} disabled={disabled}
          className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50 motion-reduce:transition-none", custom ? "border-white ring-2 ring-orange-400 ring-offset-2 ring-offset-zinc-950" : "border-dashed border-white/30")}
          style={custom ? { backgroundColor: value! } : undefined}>
          {!custom && <Plus className="size-4 text-zinc-400" aria-hidden="true" />}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side="top" align="end" sideOffset={8} className="account-popup z-50 flex w-64 flex-col gap-3 rounded-xl border border-white/10 bg-zinc-950 p-3 text-sm text-white shadow-xl outline-none">
          <div ref={field} role="slider" tabIndex={0} aria-label={t("Shade")} aria-valuetext={hex}
            className="relative h-36 w-full cursor-crosshair touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)`, backgroundImage: "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)" }}
            onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); pickField(event); }}
            onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) pickField(event); }}
            onKeyDown={event => {
              const step = event.shiftKey ? 0.1 : 0.02;
              const moves: Record<string, Partial<Hsv>> = { ArrowLeft: { s: clamp(hsv.s - step) }, ArrowRight: { s: clamp(hsv.s + step) }, ArrowUp: { v: clamp(hsv.v + step) }, ArrowDown: { v: clamp(hsv.v - step) } };
              if (moves[event.key]) { event.preventDefault(); apply({ ...hsv, ...moves[event.key] }); }
            }}>
            <span aria-hidden="true" className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: hex }} />
          </div>
          <Slider.Root min={0} max={359} step={1} value={[hsv.h]} onValueChange={([h]) => apply({ ...hsv, h })} className="relative flex h-4 w-full touch-none items-center select-none">
            <Slider.Track className="relative h-3 grow rounded-full" style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }} />
            <Slider.Thumb aria-label={t("Hue")} className="block size-4 rounded-full border-2 border-white shadow outline-none focus-visible:ring-4 focus-visible:ring-orange-400/40" style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }} />
          </Slider.Root>
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="size-9 shrink-0 rounded-lg border border-white/15" style={{ backgroundColor: hex }} />
            <input aria-label={t("Hex colour")} value={draft || hex} maxLength={7} spellCheck={false}
              onChange={event => { const text = event.target.value.startsWith("#") ? event.target.value : `#${event.target.value}`; setDraft(text); if (/^#[0-9a-f]{6}$/i.test(text)) { setHsv(hexToHsv(text.toLowerCase())); onChange(text.toLowerCase()); } }}
              onBlur={() => setDraft("")}
              className="h-9 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2.5 font-mono text-sm uppercase text-white outline-none focus:border-orange-400" />
            <button type="button" aria-pressed={picking} aria-label={t("Pick a colour from your picture")} title={t("Pick a colour from your picture")}
              onClick={() => { onPickingChange(!picking); setOpen(false); }}
              className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg border outline-none focus-visible:ring-2 focus-visible:ring-orange-400", picking ? "border-orange-400 bg-orange-500/15 text-orange-300" : "border-white/10 text-zinc-300 hover:bg-white/5")}>
              <Pipette className="size-4" aria-hidden="true" />
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
    {picking && <p role="status" className="flex w-full items-center gap-2 text-xs text-orange-300"><Pipette className="size-3.5" aria-hidden="true" />{t("Click your picture to pick a colour. Press Escape to cancel.")}</p>}
  </div>;
}
