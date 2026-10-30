"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import CapeViewer from "../components/CapeViewer";
import { usePageVisible, useReducedMotion } from "../../lib/visibility";
import { canvasPng, drawTemplate, exportApng, templateWidth, frameAt, importFrames, MAX_SOURCE_BYTES, type ComposerFrame } from "../lib/animation";

const inputClass = "w-full rounded-lg border border-white/15 bg-zinc-950 p-2.5 text-sm focus-visible:outline-2 focus-visible:outline-orange-400";
type Job = { id?: string; status: string; error?: string; cape_id?: number };

export default function FrameComposer({ links }: { links: { minecraft_uuid: string; minecraft_name: string }[] }) {
  const query = useSearchParams();
  const [uuid, setUuid] = useState(query.get("uuid") || links[0]?.minecraft_uuid || "");
  const [name, setName] = useState("");
  const [privateCape, setPrivate] = useState(false);
  const [mode, setMode] = useState<"image" | "frames" | "sheet">("frames");
  const [sheetWidth, setSheetWidth] = useState(64), [sheetHeight, setSheetHeight] = useState(32);
  const [fit, setFit] = useState<"pad" | "crop">("pad");
  const [hd, setHd] = useState(false);
  const [frames, setFrames] = useState<ComposerFrame[]>([]);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [preview, setPreview] = useState<{ canvas: HTMLCanvasElement; revision: number } | null>(null);
  const [poster, setPoster] = useState<string>();
  const previewRevision = useRef(0);
  const standard = useRef<HTMLCanvasElement>(null), high = useRef<HTMLCanvasElement>(null);
  const ownedImages = useRef(new Set<ImageBitmap>());
  const disposed = useRef(false);
  const visible = usePageVisible(), reduced = useReducedMotion();
  const current = frames[Math.min(selected, frames.length - 1)];
  const replacement = query.get("replacement");

  useEffect(() => { disposed.current = false; const images = ownedImages.current; return () => { disposed.current = true; images.forEach(image => image.close()); images.clear(); }; }, []);
  useEffect(() => {
    if (!current || !standard.current || !high.current) { setPoster(undefined); setPreview(null); return; }
    drawTemplate(standard.current, current.image, current.image.width, current.image.height, fit, 256, templateWidth(frames, fit, 256));
    drawTemplate(high.current, current.image, current.image.width, current.image.height, fit, 512, templateWidth(frames, fit, 512));
    const canvas = hd ? high.current : standard.current;
    setPreview({ canvas, revision: ++previewRevision.current });
    // A stable poster initializes skinview3d once; subsequent frames update its canvas.
    if (selected === 0 || !poster) setPoster(canvas.toDataURL("image/png"));
  // The poster is initialized independently from timeline changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, selected, fit, hd, frames]);
  useEffect(() => {
    if (!playing || !visible || reduced || !frames.length) return;
    const durations = frames.map(frame => frame.duration);
    const start = performance.now(), offset = durations.slice(0, selected).reduce((sum, value) => sum + value, 0);
    let request = 0;
    const tick = (now: number) => { setSelected(frameAt(durations, now - start + offset)); request = requestAnimationFrame(tick); };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  // Selection changes during playback must not reset its clock.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, frames, visible, reduced]);
  useEffect(() => {
    if (!job?.id || ["complete", "failed"].includes(job.status)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/cookiecapes/animations?id=${job.id}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setJob(result);
      } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Status nicht verfügbar."); }
    }, 2000);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [job]);

  function change(next: ComposerFrame[], index: number) {
    const bytes = next.reduce((sum, frame) => sum + frame.image.width * frame.image.height * 4, 0);
    if (next.length > 200 || bytes > MAX_SOURCE_BYTES) { setError("Maximal 200 Frames und 120 MiB Quellpixel."); return; }
    const keep = new Set(next.map(frame => frame.image));
    for (const image of ownedImages.current) if (!keep.has(image)) { image.close(); ownedImages.current.delete(image); }
    next.forEach(frame => ownedImages.current.add(frame.image));
    setPlaying(false); setFrames(next); setSelected(Math.max(0, Math.min(index, next.length - 1)));
  }
  async function importFiles(files: File[]) {
    setBusy(true); setError(""); setPlaying(false);
    try {
      const imported = await importFrames(files, mode, sheetWidth, sheetHeight);
      if (disposed.current) { imported.forEach(frame => frame.image.close()); return; }
      change(imported, 0); setPoster(undefined); setJob(null);
    } catch (error) { setError(error instanceof Error ? error.message : "Import fehlgeschlagen."); }
    finally { if (!disposed.current) setBusy(false); }
  }
  async function exportOrSubmit(submit: boolean) {
    setBusy(true); setPlaying(false); setError("");
    try {
      if (!submit) {
        const blob = await exportApng(frames, fit, hd ? 512 : 256);
        const url = URL.createObjectURL(blob), a = document.createElement("a");
        a.href = url; a.download = "cookiecapes.apng"; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); return;
      }
      if (!name.trim() || !links.some(link => link.minecraft_uuid === uuid)) throw new Error("Bitte Name und verknüpftes Minecraft-Konto auswählen.");
      const body = new FormData(), canvas = document.createElement("canvas");
      let bytes = 0;
      // Submit source frames; the server applies the same crop/pad and never upscales.
      for (let i = 0; i < frames.length; i++) {
        const image = frames[i].image; canvas.width = image.width; canvas.height = image.height;
        canvas.getContext("2d")!.drawImage(image, 0, 0);
        const png = await canvasPng(canvas); bytes += png.size;
        if (bytes > 32 * 1024 * 1024) throw new Error("Die PNG-Frames überschreiten 32 MiB.");
        body.append("files", png, `frame-${i}.png`);
      }
      canvas.width = canvas.height = 0;
      body.set("minecraft_name", uuid); body.set("cape_name", name); body.set("is_private", String(privateCape));
      if (replacement) body.set("replacement", replacement);
      body.set("options", JSON.stringify({ mode: "frames", fit, hd, durations_ms: frames.map(frame => frame.duration) }));
      const response = await fetch("/api/cookiecapes/animations", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setJob({ id: result.job_id, status: result.status });
    } catch (error) { setError(error instanceof Error ? error.message : "Export fehlgeschlagen."); }
    finally { if (!disposed.current) setBusy(false); }
  }
  const locked = busy || !!job && ["queued", "processing"].includes(job.status);
  const move = (direction: number) => {
    const next = [...frames], other = selected + direction;
    if (other < 0 || other >= next.length) return;
    [next[selected], next[other]] = [next[other], next[selected]]; change(next, other);
  };
  return <main className="mx-auto max-w-6xl space-y-8 px-4 py-14 sm:px-8">
    <header className="space-y-3"><Link href="/cookiecapes/account" className="text-sm text-orange-300 underline">← Zum Konto</Link><h1 className="font-nexa text-4xl sm:text-5xl">Animierte Capes</h1><p className="max-w-2xl text-zinc-400">Deine Frames, dein Rhythmus. Bis zu 200 Frames, 24 FPS und 32 MiB. Neue Animationen starten mit 12 FPS. Alle Frames werden vor der Veröffentlichung geprüft.</p></header>
    {replacement && <p role="status" className="rounded-xl border border-orange-400/30 p-4">Ersetzt Cape #{replacement}. Bis zur erfolgreichen Veröffentlichung bleibt das bisherige Cape erhalten.</p>}
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
      <section aria-label="Frame-Komposition" className="min-w-0 space-y-5 rounded-3xl border border-white/10 bg-zinc-900/60 p-5 sm:p-7">
        <h2 className="font-nexa text-2xl">Frames importieren</h2>
        <fieldset disabled={locked} className="space-y-4 disabled:opacity-60">
          <label className="block space-y-2 text-sm"><span>Importformat</span><select className={inputClass} value={mode} onChange={event => setMode(event.target.value as typeof mode)}><option value="frames">Geordnete PNG-Frames</option><option value="image">APNG, GIF oder WebP</option><option value="sheet">PNG-Sprite-Sheet (zeilenweise)</option></select></label>
          {mode === "sheet" && <div className="grid grid-cols-2 gap-3"><label className="text-sm">Frame-Breite<input className={inputClass} type="number" min={2} max={512} value={sheetWidth} onChange={e => setSheetWidth(Number(e.target.value))} /></label><label className="text-sm">Frame-Höhe<input className={inputClass} type="number" min={1} max={300} value={sheetHeight} onChange={e => setSheetHeight(Number(e.target.value))} /></label></div>}
          <label className="block space-y-2 text-sm"><span>Dateien (maximal 512 × 300 pro Frame)</span><input className={inputClass} type="file" accept={mode === "image" ? "image/png,image/apng,image/gif,image/webp" : "image/png"} multiple={mode === "frames"} onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ""; if (files.length) void importFiles(files); }} /></label>
        </fieldset>
        <div className="grid grid-cols-2 gap-3"><label className="text-sm">Vorlage<select disabled={locked} className={inputClass} value={fit} onChange={e => setFit(e.target.value as typeof fit)}><option value="pad">Transparent auffüllen</option><option value="crop">Mittig zuschneiden</option></select></label><label className="text-sm">Qualität<select disabled={locked} className={inputClass} value={hd ? "hd" : "standard"} onChange={e => setHd(e.target.value === "hd")}><option value="standard">Standard · bis 256 × 128</option><option value="hd">HD · bis 512 × 256</option></select></label></div>
        <div className="grid grid-cols-2 gap-4"><figure><canvas ref={standard} className="aspect-2/1 w-full rounded-lg border border-white/15 bg-zinc-950 [image-rendering:pixelated]" /><figcaption className="mt-2 text-xs text-zinc-400">Standard</figcaption></figure><figure><canvas ref={high} className="aspect-2/1 w-full rounded-lg border border-white/15 bg-zinc-950 [image-rendering:pixelated]" /><figcaption className="mt-2 text-xs text-zinc-400">HD · ohne Hochskalieren</figcaption></figure></div>
        <label className="block text-sm">Frame {frames.length ? selected + 1 : 0} / {frames.length}<input aria-label="Frame auswählen" type="range" min={0} max={Math.max(0, frames.length - 1)} value={selected} disabled={!frames.length || locked} onChange={event => { setPlaying(false); setSelected(Number(event.target.value)); }} className="mt-3 w-full accent-orange-500" /></label>
        <div className="flex flex-wrap gap-2"><Button disabled={!frames.length || locked || reduced} onClick={() => setPlaying(value => !value)}>{playing && visible ? "Pause" : "Abspielen"}</Button><Button variant="outline" disabled={!current || locked || selected === 0} onClick={() => move(-1)}>← Verschieben</Button><Button variant="outline" disabled={!current || locked || selected === frames.length - 1} onClick={() => move(1)}>Verschieben →</Button><Button variant="outline" disabled={!current || locked || frames.length >= 200} onClick={() => change([...frames.slice(0, selected + 1), { ...current }, ...frames.slice(selected + 1)], selected + 1)}>Duplizieren</Button><Button variant="destructive" disabled={!current || locked} onClick={() => change(frames.filter((_, index) => index !== selected), selected)}>Löschen</Button></div>
        <label className="block text-sm">Dauer dieses Frames (42–60.000 ms)<input className={inputClass} type="number" min={1000 / 24} max={60000} step="any" value={current?.duration ?? 1000 / 12} disabled={!current || locked} onChange={event => { const duration = Number(event.target.value); if (duration >= 1000 / 24 && duration <= 60000) change(frames.map((frame, index) => index === selected ? { ...frame, duration } : frame), selected); }} /></label>
        <div className="flex flex-wrap gap-2">{[6,12,24].map(fps => <Button key={fps} variant="outline" disabled={!frames.length || locked} onClick={() => change(frames.map(frame => ({ ...frame, duration: 1000 / fps })), selected)}>Alle: {fps} FPS</Button>)}</div>
        {reduced && <p className="text-sm text-zinc-400">Bewegung ist durch deine Systemeinstellung reduziert. Die Vorschau lässt sich manuell durchblättern.</p>}
      </section>
      <section aria-label="Vorschau und Veröffentlichung" className="space-y-5">
        <div className="h-96 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60"><CapeViewer capeUrl={poster} capeFrame={preview ?? undefined} animation="none" /></div>
        <fieldset disabled={locked} className="space-y-4 rounded-3xl border border-white/10 bg-zinc-900/60 p-6 disabled:opacity-60">
          <legend className="sr-only">Veröffentlichen</legend>
          <label className="block text-sm">Cape-Name<input className={inputClass} maxLength={200} value={name} onChange={event => setName(event.target.value)} /></label>
          <label className="block text-sm">Minecraft-Konto<select className={inputClass} value={uuid} onChange={event => setUuid(event.target.value)}>{links.map(link => <option key={link.minecraft_uuid} value={link.minecraft_uuid}>{link.minecraft_name}</option>)}</select></label>
          {!links.length && <p>Bitte zuerst ein Minecraft-Konto auf der Kontoseite verknüpfen.</p>}
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={privateCape} onChange={event => setPrivate(event.target.checked)} className="size-5 accent-orange-500" />Privates Cape</label>
          <Button className="w-full" disabled={!frames.length || !links.length || !name.trim()} onClick={() => void exportOrSubmit(true)}>{busy ? "Wird verarbeitet…" : replacement ? "Ersetzung einreichen" : "Zur Prüfung einreichen"}</Button>
          <Button variant="outline" className="w-full" disabled={!frames.length} onClick={() => void exportOrSubmit(false)}>Als APNG exportieren</Button>
        </fieldset>
        {error && <p role="alert" className="rounded-xl border border-red-400/30 p-4 text-sm text-red-300">{error}</p>}
        {job && <div role="status" className="space-y-2 rounded-xl border border-orange-400/20 p-4"><p>{job.status === "complete" ? "Veröffentlicht." : job.status === "failed" ? "Prüfung fehlgeschlagen." : "Privater Auftrag: " + job.status}</p>{error && <Button variant="outline" onClick={() => setJob({ ...job })}>Status erneut laden</Button>}{job.error && <p className="text-sm text-zinc-400">{job.error}</p>}{job.cape_id && <Link className="text-orange-300 underline" href={`/cookiecapes/capes/${job.cape_id}`}>Cape #{job.cape_id} ansehen</Link>}</div>}
      </section>
    </div>
  </main>;
}
