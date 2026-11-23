"use client";

import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { ContextMenu, Dialog, Switch } from "radix-ui";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Loader2, Paintbrush, Settings2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startMinecraftLink, uploadWebsiteCape } from "@/app/actions/account-actions";
import { actionValue, type AccountInfo, type SubmissionQuota } from "../lib/account-types";
import { frameAt, MAX_FRAMES, MAX_UPLOAD_BYTES, MIN_FRAME_DURATION, MAX_FRAME_DURATION } from "../lib/animation-manifest";
import { canvasPng, drawTemplate, exportApng, templateWidth, importCapeManifest, MAX_SOURCE_BYTES, type ComposerFrame } from "../lib/animation";
import { composeCape, cropRect, DEFAULT_FRAMING, isPixelArt, type Framing } from "../lib/cape-compose";
import { loadCapeSource, type CapeSource } from "../lib/cape-source";
import { CREATOR_IMPORT_KEY, EDITOR_DRAFT_KEY, type EditorDraft } from "../editor/draft";
import { toast } from "@/components/ui/toast";
import { usePageVisible, useReducedMotion } from "../../lib/visibility";
import CapeViewer from "./CapeViewer";
import CapeFraming from "./CapeFraming";
import MinecraftAccountSelect from "./MinecraftAccountSelect";
import MinecraftServerLink from "./MinecraftServerLink";
import MCIDButton from "./MCIDButton";
import SubmissionQuotaBar from "./SubmissionQuotaBar";
import { ToastMessage } from "./ToastMessage";
import { useTranslations } from "../i18n/client";
import { useDuplicateToast } from "../lib/duplicate-toast";

const inputClass = "w-full rounded-lg border border-white/15 bg-zinc-950 p-2.5 text-sm focus-visible:outline-2 focus-visible:outline-orange-400";
const STATIC_LIMIT = 3 * 1024 * 1024;
type StepKey = "picture" | "position" | "publish";
type Job = { id?: string; status: string; error?: string; error_code?: string; existing_cape_id?: number; cape_id?: number };
interface Props {
  onAccountLinked?: (account: AccountInfo, uuid: string) => void;
  account: AccountInfo; uuid?: string; quota?: SubmissionQuota; replacementId?: number;
  initialName?: string; initialCapeUrl?: string; initialAnimationManifest?: string; disabled?: boolean; onCancel?: () => void; onUploaded?: () => void; onBusyChange?: (busy: boolean) => void;
}

/** Bring a picture or an animated picture; it becomes a cape in one screen. */
export default function CapeCreator({ account: initialAccount, onAccountLinked, uuid: controlledUuid, quota, replacementId, initialName = "", initialCapeUrl, initialAnimationManifest, disabled = false, onCancel, onUploaded, onBusyChange }: Props) {
  const [updatedAccount, setAccount] = useState<AccountInfo | null>(null);
  const account = updatedAccount ?? initialAccount;
  const { t } = useTranslations();
  const router = useRouter();
  const id = useId();
  const replacing = replacementId !== undefined;
  const [selectedUuid, setUuid] = useState(account.links[0]?.minecraft_uuid ?? "");
  const uuid = controlledUuid ?? (account.links.length === 1 ? account.links[0].minecraft_uuid : selectedUuid);
  const player = account.links.find(link => link.minecraft_uuid === uuid);
  const duplicateToast = useDuplicateToast();
  const reportedDuplicate = useRef<string | undefined>(undefined);

  const [source, setSource] = useState<CapeSource | null>(null);
  const [frames, setFrames] = useState<ComposerFrame[]>([]);
  const [edited, setEdited] = useState(false);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [framing, setFraming] = useState<Framing>(DEFAULT_FRAMING);
  const [kindOverride, setKindOverride] = useState<"texture" | "artwork" | null>(null);
  const [pixelOverride, setPixelOverride] = useState<boolean | null>(null);
  const [background, setBackground] = useState<string | null>(null);
  const [name, setName] = useState(initialName);
  const [privateCape, setPrivate] = useState(false);
  const [hd, setHd] = useState(false);
  const [more, setMore] = useState(false);
  const [sourceKey, setSourceKey] = useState(0);
  const [stepKey, setStepKey] = useState<StepKey>("picture");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [coverage, setCoverage] = useState(1);
  const [job, setJob] = useState<Job | null>(null);
  const [preview, setPreview] = useState<{ canvas: HTMLCanvasElement; revision: number } | null>(null);

  const previewCanvas = useRef<HTMLCanvasElement | null>(null), scratch = useRef<HTMLCanvasElement | null>(null);
  const previewRevision = useRef(0), version = useRef(0);
  const ownedImages = useRef(new Set<ImageBitmap>());
  const section = useRef<HTMLElement>(null), fileInput = useRef<HTMLInputElement>(null), moreTrigger = useRef<HTMLButtonElement>(null);
  const draggedFrame = useRef<number | null>(null);
  const timeline = useRef<HTMLDivElement>(null);
  const reportedJob = useRef<string | undefined>(undefined);
  const visible = usePageVisible(), reduced = useReducedMotion();

  const kind = kindOverride ?? source?.kind ?? "artwork";
  const pixelArt = pixelOverride ?? (source ? isPixelArt(source.width, source.height) : false);
  const current = frames[Math.min(selected, frames.length - 1)];
  const animated = !!source?.animated;
  const serverComposes = !!source && animated && !source.decoded && kind === "artwork";
  const pending = !!job && ["queued", "processing"].includes(job.status);
  const jobError = !replacing ? job?.error?.replace(/previous cape retained\.?/gi, t("No cape was uploaded.")) : job?.error;
  const locked = disabled || busy || pending;
  const ready = !!source && frames.length > 0;
  const blocker = !source ? "" : !replacing && !name.trim() ? t("Give your cape a name to publish it.") : quota?.remaining === 0 ? t("You have used today's uploads. Try again after the reset.") : "";
  const steps: StepKey[] = ["picture", ...(source && kind === "artwork" ? ["position" as const] : []), "publish"];
  const stepLabels = { picture: t("Picture"), position: t("Position"), publish: replacing ? t("Publish") : t("Name and publish") };
  const step: StepKey = !source ? "picture" : steps.includes(stepKey) ? stepKey : "publish";
  const stepIndex = steps.indexOf(step);
  const canPublish = !locked && ready && !!player && (replacing || !!name.trim()) && quota?.remaining !== 0;

  const notifyBusy = useEffectEvent((value: boolean) => onBusyChange?.(value));
  useEffect(() => { notifyBusy(busy || pending); return () => notifyBusy(false); }, [busy, pending]);
  useEffect(() => {
    if (job?.id && job.status === "failed" && reportedDuplicate.current !== job.id && duplicateToast({ code: job.error_code, existingCapeId: job.existing_cape_id })) reportedDuplicate.current = job.id;
  });
  useEffect(() => {
    const images = ownedImages.current, generation = version;
    return () => { generation.current++; images.forEach(image => image.close()); images.clear(); };
  }, []);

  // Compose the current frame for the 3D preview; the canvas is handed to the WebGL viewer.
  /* eslint-disable react-hooks/set-state-in-effect -- Draws to an imperative canvas and publishes its revision. */
  useEffect(() => {
    if (!current || !source) { setPreview(null); return; }
    previewCanvas.current ??= document.createElement("canvas");
    scratch.current ??= document.createElement("canvas");
    const canvas = previewCanvas.current;
    if (kind === "artwork") setCoverage(composeCape(canvas, scratch.current, current.image, current.image.width, current.image.height, framing, hd || !animated ? 8 : 4, { pixelArt, background: framing.fit === "fit" ? background : null }));
    else { const maximum = hd || !animated ? 512 : 256; drawTemplate(canvas, current.image, current.image.width, current.image.height, "pad", maximum, templateWidth(frames, "pad", maximum)); setCoverage(1); }
    setPreview({ canvas, revision: ++previewRevision.current });
  }, [current, source, frames, kind, framing, pixelArt, background, hd, animated]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!playing || !visible || reduced || frames.length < 2) return;
    const durations = frames.map(frame => frame.duration);
    const start = performance.now(), offset = durations.slice(0, selected).reduce((sum, value) => sum + value, 0);
    let request = 0;
    const tick = (now: number) => { setSelected(frameAt(durations, now - start + offset)); request = requestAnimationFrame(tick); };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, frames, visible, reduced]);

  useEffect(() => {
    if (!job?.id || !pending) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/cookiecapes/animations?id=${job.id}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw Object.assign(new Error(result.error), { code: result.code, existingCapeId: result.existingCapeId });
        setError(""); setJob(result);
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : t("Status unavailable.")); }
    }, 2000);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [job, pending, t]);



  function change(next: ComposerFrame[], index: number, dirty = true) {
    const bytes = next.reduce((sum, frame) => sum + frame.image.width * frame.image.height * 4, 0);
    if (next.length > MAX_FRAMES || bytes > MAX_SOURCE_BYTES) { setError(t("Maximum 200 frames and 120 MiB of source pixels.")); return; }
    const keep = new Set(next.map(frame => frame.image));
    for (const image of ownedImages.current) if (!keep.has(image)) { image.close(); ownedImages.current.delete(image); }
    next.forEach(frame => ownedImages.current.add(frame.image));
    setFrames(next); setEdited(dirty); setSelected(Math.max(0, Math.min(index, next.length - 1)));
  }
  function reset(clearName = true) {
    setSource(null); change([], 0, false); setPlaying(false); setFraming(DEFAULT_FRAMING); setKindOverride(null); setPixelOverride(null); setBackground(null);
    if (clearName) { setName(initialName); setStepKey("picture"); }
    setPreview(null); setCoverage(1);
  }
  function accept(next: CapeSource) {
    change(next.frames, 0, false);
    setSource(next); setFraming(DEFAULT_FRAMING); setKindOverride(null); setPixelOverride(null); setBackground(null);
    setPlaying(next.frames.length > 1);
    if (next.resampled) toast.add({ title: t("Your animation was automatically reduced to a maximum of 24 FPS, preserving playback speed."), type: "success" });
    if (next.animated && !next.decoded) toast.add({ title: t("Your browser shows only the first frame. The full animation is created when you publish."), type: "info" });
  }
  async function choose(files: File[]) {
    if (locked || !files.length) return;
    const generation = ++version.current;
    setBusy(true); setError(""); setJob(null);
    try {
      const next = await loadCapeSource(files, t);
      if (generation !== version.current) { new Set(next.frames.map(frame => frame.image)).forEach(image => image.close()); return; }
      reset(false); accept(next); setSourceKey(key => key + 1); setStepKey(next.kind === "artwork" ? "position" : "publish");
    } catch (cause) { if (generation === version.current) setError(cause instanceof Error ? cause.message : t("Import failed.")); }
    finally { if (generation === version.current) setBusy(false); }
  }
  async function editCurrentAnimation() {
    if (locked || !initialAnimationManifest) return;
    setBusy(true); setError("");
    const generation = ++version.current;
    try {
      const loaded = await importCapeManifest(initialAnimationManifest, t);
      if (generation !== version.current) { new Set(loaded.frames.map(frame => frame.image)).forEach(image => image.close()); return; }
      const { width, height } = loaded.frames[0].image;
      reset(false);
      accept({ files: [], name: initialName, animated: true, decoded: true, frames: loaded.frames, width, height, sourceWidth: width, sourceHeight: height, kind: "texture", resampled: false });
      setHd(loaded.hd);
    } catch (cause) { if (generation === version.current) setError(cause instanceof Error ? cause.message : t("The frames could not be opened.")); }
    finally { if (generation === version.current) setBusy(false); }
  }
  async function linkMinecraft() {
    setBusy(true); setError("");
    try { window.location.assign(actionValue(await startMinecraftLink()).url); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t("Minecraft could not be linked.")); }
    finally { setBusy(false); }
  }

  const finishJob = useEffectEvent(() => {
    reset();
    toast.add({ title: t("Your cape was uploaded."), type: "success" });
    onUploaded?.();
  });
  useEffect(() => {
    if (job?.id && job.status === "complete" && reportedJob.current !== job.id) {
      reportedJob.current = job.id;
      finishJob();
    }
  }, [job]);

  // Accept a pasted picture while this creator has focus (or is the only creator on the page).
  const onPaste = useEffectEvent((event: ClipboardEvent) => {
    if (locked || more) return;
    const focused = document.activeElement;
    if (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement) return;
    if (!(section.current?.contains(focused) || (!replacing && (!focused || focused === document.body)))) return;
    const files = Array.from(event.clipboardData?.files ?? []).filter(file => file.type.startsWith("image/"));
    if (!files.length) return;
    event.preventDefault();
    void choose(files);
  });
  useEffect(() => {
    const listener = (event: ClipboardEvent) => onPaste(event);
    window.addEventListener("paste", listener);
    return () => window.removeEventListener("paste", listener);
  }, []);

  // A design finished in the editor comes back here.
  const importFromEditor = useEffectEvent(async () => {
    let raw: string | null = null;
    try { raw = sessionStorage.getItem(CREATOR_IMPORT_KEY); if (raw) sessionStorage.removeItem(CREATOR_IMPORT_KEY); } catch { return; }
    if (!raw) return;
    try {
      const { name: importedName, dataUrl } = JSON.parse(raw) as { name?: string; dataUrl?: string };
      if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png;base64,")) return;
      const blob = await (await fetch(dataUrl)).blob();
      await choose([new File([blob], `${importedName || "cape"}.png`, { type: "image/png" })]);
      section.current?.scrollIntoView({ block: "start" });
    } catch { setError(t("The design from the editor could not be opened.")); }
  });
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Reads a one-time handoff from tab storage after hydration.
  useEffect(() => { if (!replacing) void importFromEditor(); }, [replacing]);

  /** Renders the given frame as an upload-ready PNG. */
  async function framePng(image: ImageBitmap, k: number) {
    const canvas = document.createElement("canvas"), work = document.createElement("canvas");
    try {
      if (kind === "artwork") composeCape(canvas, work, image, image.width, image.height, framing, k, { pixelArt, background: framing.fit === "fit" ? background : null });
      else { canvas.width = image.width; canvas.height = image.height; canvas.getContext("2d")!.drawImage(image, 0, 0); }
      return await canvasPng(canvas, t);
    } finally { canvas.width = canvas.height = work.width = work.height = 0; }
  }

  async function publish() {
    if (!canPublish || !source || !player) return;
    setBusy(true); setPlaying(false); setError("");
    const capeName = (replacing ? initialName : name).trim();
    try {
      const body = new FormData();
      body.set("cape_name", capeName); body.set("is_private", String(privateCape));
      if (!animated) {
        let file = source.files[0];
        if (kind === "artwork" || !file || file.type !== "image/png" || file.size > STATIC_LIMIT || source.width !== source.sourceWidth) {
          file = new File([await framePng(frames[0].image, 8)], `${capeName || "cape"}.png`, { type: "image/png" });
        }
        if (file.size > STATIC_LIMIT) throw new Error(t("Static capes must not exceed 3 MiB."));
        body.set("minecraft_uuid", uuid); body.set("cape", file);
        actionValue(await uploadWebsiteCape(body, replacementId));
        setJob({ status: "complete" }); reset();
        toast.add({ title: t("Your cape was uploaded."), type: "success" });
        onUploaded?.();
        return;
      }
      let options: Record<string, unknown>;
      if (serverComposes) {
        if (source.sourceWidth > 2048 || source.sourceHeight > 2048) throw new Error(t("Your browser cannot shrink this animation. Use one up to 2048 × 2048 pixels or try Chrome or Edge."));
        const rect = cropRect(source.width, source.height, framing), scale = source.sourceWidth / source.width;
        source.files.forEach(file => body.append("files", file));
        options = { mode: "image", fit: "face", hd, fps: 12, pixel_art: pixelArt, crop: { x: rect.x * scale, y: rect.y * scale, width: rect.width * scale, height: rect.height * scale }, ...(framing.fit === "fit" && background ? { background } : {}) };
      } else if (kind === "texture" && !edited && !source.resampled && source.files.length && source.width === source.sourceWidth) {
        source.files.forEach(file => body.append("files", file));
        options = { mode: source.files.length > 1 ? "frames" : "image", fit: "pad", hd, fps: 12 };
      } else {
        let total = 0;
        for (let i = 0; i < frames.length; i++) {
          const blob = await framePng(frames[i].image, hd ? 8 : 4);
          total += blob.size;
          if (total > MAX_UPLOAD_BYTES) throw new Error(hd ? t("The animation is too large in HD. Turn off HD or shorten it.") : t("The frames exceed 32 MiB."));
          body.append("files", blob, `frame-${i}.png`);
        }
        options = { mode: "frames", fit: "pad", hd, fps: 12, durations_ms: frames.map(frame => frame.duration) };
      }
      body.set("minecraft_name", uuid);
      if (replacing) body.set("replacement", String(replacementId));
      body.set("options", JSON.stringify(options));
      const response = await fetch("/api/cookiecapes/animations", { method: "POST", body });
      const result = await response.json(); if (!response.ok) throw Object.assign(new Error(result.error), { code: result.code, existingCapeId: result.existingCapeId });
      setJob({ id: result.job_id, status: result.status });
    } catch (cause) { if (!duplicateToast(cause)) setError(cause instanceof Error ? cause.message : t("Upload failed.")); }
    finally { setBusy(false); }
  }

  async function openInEditor() {
    if (!current || kind !== "artwork" || animated) return;
    const atlas = document.createElement("canvas"), work = document.createElement("canvas"), region = document.createElement("canvas");
    composeCape(atlas, work, current.image, current.image.width, current.image.height, framing, 8, { pixelArt, background: framing.fit === "fit" ? background : null });
    // The editor works on the 22 × 17 cape area at 16 × scale (352 × 272).
    region.width = 352; region.height = 272;
    const context = region.getContext("2d")!;
    context.imageSmoothingEnabled = false;
    context.drawImage(atlas, 0, 0, 176, 136, 0, 0, 352, 272);
    const imageId = `layer-img-${Date.now()}`;
    const draft: EditorDraft = { activeTemplate: "standard", activeLayerId: imageId, layers: [
      { id: imageId, type: "image", name: name.trim() || "Cape", visible: true, locked: false, opacity: 1, imageSrc: region.toDataURL("image/png"), x: 0, y: 0, width: 352, height: 272, rotation: 0 },
      { id: "layer-drawing-1", type: "drawing", name: "Zeichnung 1", visible: true, locked: false, opacity: 1, lines: [] },
    ] };
    try { sessionStorage.setItem(EDITOR_DRAFT_KEY, JSON.stringify(draft)); }
    catch { setError(t("The draft could not be saved. Export your cape as PNG before leaving.")); return; }
    router.push("/cookiecapes/editor");
  }

  async function exportFrames() {
    if (!frames.length || locked) return;
    setBusy(true); setError("");
    try {
      const blob = await exportApng(frames, "pad", hd ? 512 : 256, t);
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url; link.download = `${name || "cape"}.apng`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("Export failed.")); }
    finally { setBusy(false); }
  }
  function reorder(from: number, to: number) {
    if (locked || from === to || !frames[from] || !frames[to]) return;
    const next = [...frames];
    next.splice(to, 0, next.splice(from, 1)[0]);
    change(next, to);
    timeline.current?.querySelectorAll("button")[to]?.focus();
  }

  const status = job && job.status !== "complete" && !(job.status === "failed" && job.error_code === "duplicate_cape" && Number.isSafeInteger(job.existing_cape_id) && job.existing_cape_id! > 0);
  return <section ref={section} aria-labelledby={`${id}-heading`} className="cape-upload relative overflow-hidden rounded-2xl border border-border bg-card">
    {error && <ToastMessage message={error} />}
    {status && <ToastMessage key={job.id} message={[job.status === "failed" ? t("The upload was not published.") : t("Your cape is being processed. You can leave this page open."), jobError].filter(Boolean).join(" ")} type={job.status === "failed" || job.error ? "error" : "info"} />}
    <div className="relative border-b border-white/10 p-6 sm:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0"><h2 id={`${id}-heading`} className="font-nexa text-3xl text-white">{replacing ? <>{t("Replace cape image")}: <span className="wrap-anywhere text-orange-300">{initialName}</span></> : t("Turn any picture into a cape")}</h2>
        </div>
        {quota && <SubmissionQuotaBar quota={quota} />}
      </div>
      <ol aria-label={t("Upload steps")} className={cn("mt-7 grid gap-2 sm:gap-4", steps.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {steps.map((key, index) => {
          const reachable = !locked && (key === "picture" || !!source);
          return <li key={key}>
            <button type="button" disabled={!reachable} aria-current={step === key ? "step" : undefined} onClick={() => setStepKey(key)}
              className={cn("flex w-full items-center gap-2 rounded-xl px-2 py-3 text-left text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-400 motion-reduce:transition-none sm:px-4 sm:text-sm", step === key ? "bg-orange-500/10 text-orange-300" : "text-zinc-500 enabled:hover:text-zinc-300")}>
              <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border", index <= stepIndex ? "border-orange-400/40 text-orange-300" : "border-white/10")}>{index < stepIndex ? <Check size={12} aria-hidden="true" /> : index + 1}</span>
              <span className="truncate">{stepLabels[key]}</span>
            </button>
          </li>;
        })}
      </ol>
    </div>
    <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_0.8fr]">
      <div className="flex min-w-0 flex-col justify-between gap-8">
        <div key={step} className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-200 motion-reduce:animate-none">
          <h3 className="text-xl font-bold text-white">{stepLabels[step]}</h3>
          {step === "picture" && <>
            {account.links.length > 1 && controlledUuid === undefined && <MinecraftAccountSelect links={account.links} value={uuid} onChange={setUuid} disabled={locked} label={t("Minecraft account for the upload")} />}
            {source && <button type="button" disabled={locked} onClick={() => fileInput.current?.click()} title={t("Change picture")}
              className="group flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm outline-none transition-colors hover:border-white/25 focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-60 motion-reduce:transition-none">
              <span className="min-w-0 flex-1 truncate text-zinc-200">{source.files[0]?.name ?? initialName}</span>
              {animated && <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-xs tabular-nums text-zinc-300">{t("{count} frames", { count: frames.length })}</span>}
              <span className="flex shrink-0 items-center gap-1.5 text-zinc-400 group-hover:text-white"><ImagePlus className="size-4" aria-hidden="true" />{t("Change picture")}</span>
            </button>}
            <div className={cn("relative rounded-xl border-2 border-dashed px-6 text-center transition-colors focus-within:ring-2 focus-within:ring-orange-400 motion-reduce:transition-none", source ? "py-6" : "py-10", dragging ? "border-orange-400 bg-orange-500/10" : "border-white/15 bg-black/20 hover:border-white/30")}
              onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = locked ? "none" : "copy"; setDragging(!locked); }}
              onDragLeave={() => setDragging(false)}
              onDrop={event => { event.preventDefault(); setDragging(false); if (!locked) void choose(Array.from(event.dataTransfer.files)); }}>
              {busy ? <Loader2 size={36} className="mx-auto mb-3 animate-spin text-orange-400 motion-reduce:animate-none" aria-hidden="true" /> : <ImagePlus size={36} className="mx-auto mb-3 text-orange-400" aria-hidden="true" />}
              <p className="font-bold text-white" aria-live="polite">{busy ? t("Preparing your cape…") : t("Drop your picture here")}</p>
              <p className="mt-1 text-sm text-zinc-400">{t("or click to choose one.")}</p>
              <input id={`${id}-file`} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/apng" multiple disabled={locked} aria-label={t("Choose a picture")} aria-describedby={`${id}-file-help`} className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed" onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ""; void choose(files); }} />
              <p id={`${id}-file-help`} className="mt-4 text-xs text-zinc-500">{t("PNG, JPG, GIF, APNG or WebP up to 32 MiB.")}</p>
              {replacing && initialAnimationManifest && !source && <Button type="button" variant="outline" className="relative z-10 mt-4" disabled={locked} onClick={() => void editCurrentAnimation()}>{t("Edit current animation")}</Button>}
            </div>
            {source && kind === "texture" && <p className="text-sm leading-relaxed text-zinc-400">{t("This file already uses the cape layout, so it is used exactly as it is.")}</p>}
          </>}
          {step === "position" && current && <>
            <CapeFraming image={current.image} width={current.image.width} height={current.image.height} framing={framing} onChange={setFraming} pixelArt={pixelArt} background={background} onBackgroundChange={setBackground} disabled={locked} />
            {coverage < 0.1 && <p role="status" className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">{t("Your cape is almost invisible. Choose a picture with more visible pixels or add a background colour.")}</p>}
          </>}
          {step === "publish" && <>
            {!replacing && <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label htmlFor={`${id}-name`} className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-zinc-300">{t("Cape name")}
                <input id={`${id}-name`} autoFocus value={name} maxLength={100} required disabled={locked} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); void publish(); } }} placeholder={t("For example: Sunset")} className="h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-white outline-none placeholder:text-zinc-600 focus:border-orange-400 disabled:opacity-50" />
              </label>
              <label htmlFor={`${id}-private`} className="flex h-11 shrink-0 cursor-pointer items-center gap-3 px-3 text-sm text-zinc-300">
                <Switch.Root id={`${id}-private`} checked={privateCape} disabled={locked} onCheckedChange={setPrivate} className="inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-zinc-700 p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-orange-400 data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50">
                  <Switch.Thumb className="block size-4 rounded-full bg-white transition-transform data-[state=checked]:translate-x-4 motion-reduce:transition-none" />
                </Switch.Root>{t("Private")}
              </label>
            </div>}
            {!account.links.length && <div className="flex flex-col gap-3 rounded-xl border border-orange-400/25 bg-orange-500/5 p-4">
              <p className="text-sm font-medium text-orange-200">{t("Link your Minecraft account to publish.")}</p>
              <div className="flex flex-wrap items-center gap-2">
                <MinecraftServerLink account={account} disabled={locked} onLinked={(nextAccount, linkedUuid) => {
                  if (onAccountLinked) onAccountLinked(nextAccount, linkedUuid);
                  else { setAccount(nextAccount); setUuid(linkedUuid); }
                }} />
                <MCIDButton className="min-w-0 flex-1 px-3 text-sm" disabled={locked || !account.mcid_enabled} onClick={() => void linkMinecraft()}>{t("Link with MC-ID")}</MCIDButton>
              </div>
              {!account.mcid_enabled && <p className="text-xs text-zinc-500">{t("MC-ID is currently not enabled.")}</p>}
            </div>}
            {blocker && account.links.length > 0 && <p className="text-sm text-zinc-400">{blocker}</p>}
            {player && <p className="text-xs leading-relaxed text-zinc-500">{t("Publishes for {name}.", { name: player.minecraft_name })}</p>}
          </>}
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/apng" multiple hidden onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ""; void choose(files); }} />
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
          {onCancel && <Button size="lg" type="button" variant="outline" disabled={locked} onClick={onCancel}>{t("Cancel")}</Button>}
          {stepIndex > 0 && <Button size="lg" type="button" variant="outline" disabled={locked} onClick={() => setStepKey(steps[stepIndex - 1])}><ArrowLeft size={16} aria-hidden="true" />{t("Back")}</Button>}
          {source && (step === "position" || (kind === "texture" && step === "picture")) && <Button ref={moreTrigger} size="lg" type="button" variant="outline" disabled={locked} onClick={() => setMore(true)}><Settings2 aria-hidden="true" />{t("More options")}</Button>}
          {step !== "publish"
            ? <Button size="lg" type="button" className="ml-auto" disabled={locked || !source} onClick={() => setStepKey(steps[stepIndex + 1])}>{t("Next")}<ArrowRight size={16} aria-hidden="true" /></Button>
            : <Button size="lg" type="button" className="ml-auto" aria-busy={busy || pending} disabled={!canPublish} onClick={() => void publish()}>{busy || pending ? <Loader2 data-icon="inline-start" className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Upload data-icon="inline-start" aria-hidden="true" />}{pending ? t("Processing") : busy ? t("Uploading") : replacing ? t("Update Cape") : t("Publish cape")}</Button>}
          {error && pending && <Button variant="outline" onClick={() => setJob({ ...job })}>{t("Retry status")}</Button>}
        </div>
      </div>
      <div className="relative min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div role="group" aria-label={t("3D preview of {name}", { name: player?.minecraft_name ?? name })} className="cape-upload-preview relative h-96 w-full">
          <CapeViewer allowElytraSwitch cameraDistance={46} focusCapeKey={sourceKey || undefined} capeUrl={source ? undefined : initialCapeUrl} animationManifest={source ? undefined : initialAnimationManifest} capeFrame={preview ?? undefined} minecraftName={player?.minecraft_name} animation="idle" />
          {frames.length > 1 && <Button size="sm" type="button" variant="outline" className="absolute top-4 right-4 z-30" disabled={locked || reduced} onClick={() => setPlaying(value => !value)}>{playing && visible ? t("Pause") : t("Play")}</Button>}
        </div>
        {reduced && frames.length > 1 && <p role="status" className="text-sm text-zinc-400">{t("Motion is reduced by your system settings. You can scrub through the preview manually.")}</p>}
      </div>
    </div>

    <Dialog.Root open={more} onOpenChange={setMore}>
      <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
        <Dialog.Content onCloseAutoFocus={event => { event.preventDefault(); moreTrigger.current?.focus(); }} className="account-dialog account-advanced-dialog fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 text-white">
          <header><div className="mb-3 flex items-start justify-between gap-4"><Dialog.Title className="font-nexa text-2xl">{t("More options")}</Dialog.Title><Dialog.Close asChild><Button variant="outline" aria-label={t("Close more options")}>{t("Close")}</Button></Dialog.Close></div></header>
          <div className="flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto overscroll-contain p-5 sm:p-7">
            <OptionSwitch id={`${id}-texture`} label={t("Use as finished cape texture")} description={t("Turn this on if your file was drawn on the cape template. It is then uploaded without changes.")} checked={kind === "texture"} disabled={locked} onChange={value => setKindOverride(value ? "texture" : "artwork")} />
            {kind === "artwork" && <OptionSwitch id={`${id}-pixel`} label={t("Pixel art")} description={t("Keeps hard pixel edges instead of smoothing the picture.")} checked={pixelArt} disabled={locked} onChange={setPixelOverride} />}
            {animated && <OptionSwitch id={`${id}-hd`} label={t("HD quality")} description={t("Twice the resolution for animations. Larger uploads take longer.")} checked={hd} disabled={locked} onChange={setHd} />}
            {kind === "artwork" && !animated && <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-4">
              <p className="text-sm font-medium">{t("Fine-tune in the editor")}</p>
              <p className="text-xs text-zinc-400">{t("Paint details on top of your cape. When you are done, choose “Use this cape” in the editor to come back here.")}</p>
              <Button type="button" variant="outline" className="self-start" disabled={locked} onClick={() => void openInEditor()}><Paintbrush aria-hidden="true" />{t("Open in editor")}</Button>
            </div>}
            {animated && source?.decoded && <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm" aria-live="polite">{t("Frame {current} / {total}", { current: frames.length ? selected + 1 : 0, total: frames.length })}</p>
                <div className="flex gap-2">
                  <Button type="button" size="icon" variant="outline" disabled={!frames.length} aria-label={t("Scroll frames left")} aria-controls={`${id}-timeline`} onClick={() => timeline.current?.scrollBy({ left: -312, behavior: reduced ? "auto" : "smooth" })}><ArrowLeft aria-hidden="true" /></Button>
                  <Button type="button" size="icon" variant="outline" disabled={!frames.length} aria-label={t("Scroll frames right")} aria-controls={`${id}-timeline`} onClick={() => timeline.current?.scrollBy({ left: 312, behavior: reduced ? "auto" : "smooth" })}><ArrowRight aria-hidden="true" /></Button>
                </div>
              </div>
              <p className="text-xs text-zinc-400">{t("Drag frames to reorder. Right-click for Duplicate or Delete. Use Alt + arrow keys to reorder with the keyboard.")}</p>
              <div ref={timeline} id={`${id}-timeline`} role="group" aria-label={t("Frame timeline")} className="flex w-full min-w-0 shrink-0 gap-2 overflow-x-auto rounded-xl border border-white/10 bg-black/20 p-3">
                {frames.map((frame, index) => <ContextMenu.Root key={index} onOpenChange={open => { if (open) { setPlaying(false); setSelected(index); } }}>
                  <ContextMenu.Trigger asChild disabled={locked}>
                    <button type="button" disabled={locked} draggable={!locked} aria-label={t("Frame {number}", { number: index + 1 })} aria-pressed={selected === index}
                      className={cn("w-20 shrink-0 cursor-grab rounded-lg border-2 p-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50", selected === index ? "border-orange-400 bg-orange-400/10 text-orange-300" : "border-transparent bg-zinc-900 text-zinc-400")}
                      onClick={() => { setPlaying(false); setSelected(index); }}
                      onDragStart={event => { draggedFrame.current = index; setPlaying(false); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(index)); }}
                      onDragEnd={() => { draggedFrame.current = null; }}
                      onDragOver={event => { if (!locked && draggedFrame.current !== null) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }}
                      onDrop={event => { event.preventDefault(); if (draggedFrame.current !== null) reorder(draggedFrame.current, index); draggedFrame.current = null; }}
                      onKeyDown={event => { if (event.altKey && ["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); reorder(index, index + (event.key === "ArrowLeft" ? -1 : 1)); } }}>
                      <FrameThumbnail frame={frame} />
                      <span className="mt-1 block">{index + 1} · {Math.round(frame.duration)} ms</span>
                    </button>
                  </ContextMenu.Trigger>
                  <ContextMenu.Portal><ContextMenu.Content className="account-popup z-60 min-w-36 rounded-lg border border-white/15 bg-zinc-950 p-1 text-sm text-white shadow-xl">
                    <ContextMenu.Item disabled={locked || frames.length >= MAX_FRAMES} className="cursor-pointer rounded px-3 py-2 outline-none data-highlighted:bg-white/10 data-disabled:opacity-40" onSelect={() => change([...frames.slice(0, index + 1), { ...frame }, ...frames.slice(index + 1)], index + 1)}>{t("Duplicate")}</ContextMenu.Item>
                    <ContextMenu.Item disabled={locked || frames.length <= 1} className="cursor-pointer rounded px-3 py-2 text-red-300 outline-none data-highlighted:bg-white/10 data-disabled:opacity-40" onSelect={() => change(frames.filter((_, item) => item !== index), index)}>{t("Delete")}</ContextMenu.Item>
                  </ContextMenu.Content></ContextMenu.Portal>
                </ContextMenu.Root>)}
              </div>
              <label className="block text-sm">{t("Frame duration (42–60,000 ms)")}<input className={inputClass} type="number" min={MIN_FRAME_DURATION} max={MAX_FRAME_DURATION} step="any" value={Number((current?.duration ?? 1000 / 12).toFixed(2))} disabled={!current || locked} onChange={event => { const duration = Number(event.target.value); if (duration >= MIN_FRAME_DURATION && duration <= MAX_FRAME_DURATION) change(frames.map((frame, index) => index === selected ? { ...frame, duration } : frame), selected); }} /></label>
              <div className="flex flex-wrap gap-2">{[6, 12, 24].map(fps => <Button key={fps} variant="outline" disabled={!frames.length || locked} onClick={() => change(frames.map(frame => ({ ...frame, duration: 1000 / fps })), selected)}>{t("All: {fps} FPS", { fps })}</Button>)}</div>
            </>}
          </div>
          <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-white/10">
            {animated && source?.decoded && kind === "texture" && <Button type="button" variant="outline" disabled={locked || !frames.length} onClick={() => void exportFrames()}>{t("Export as APNG")}</Button>}
            <Dialog.Close asChild><Button type="button">{t("Done")}</Button></Dialog.Close>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </section>;
}

function OptionSwitch({ id, label, description, checked, disabled, onChange }: { id: string; label: string; description: string; checked: boolean; disabled: boolean; onChange: (value: boolean) => void }) {
  return <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-white/10 p-4">
    <span className="flex flex-col gap-1"><span className="text-sm font-medium text-white">{label}</span><span className="text-xs leading-relaxed text-zinc-400">{description}</span></span>
    <Switch.Root id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} className="mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-zinc-700 p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-orange-400 data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50">
      <Switch.Thumb className="block size-5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-5 motion-reduce:transition-none" />
    </Switch.Root>
  </label>;
}

function FrameThumbnail({ frame }: { frame: ComposerFrame }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const scale = Math.min(64 / frame.image.width, 40 / frame.image.height);
    element.width = Math.max(1, Math.round(frame.image.width * scale)); element.height = Math.max(1, Math.round(frame.image.height * scale));
    const context = element.getContext("2d")!;
    context.imageSmoothingQuality = "high";
    context.drawImage(frame.image, 0, 0, element.width, element.height);
  }, [frame]);
  return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none mx-auto h-10 max-w-full rounded bg-zinc-800 object-contain" />;
}

