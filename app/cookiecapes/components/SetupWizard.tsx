"use client";

import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { ContextMenu, Dialog, Switch } from "radix-ui";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startMinecraftLink, uploadWebsiteCape } from "@/app/actions/account-actions";
import { actionValue, type AccountInfo, type SubmissionQuota } from "../lib/account-types";
import { selectCapeFiles, type CapeSelection } from "../lib/cape-upload";
import { canvasPng, drawTemplate, exportApng, templateWidth, frameAt, importCapeManifest, importFrames, inspectImage, limitFrameRate, MAX_SOURCE_BYTES, type ComposerFrame } from "../lib/animation";
import { toast } from "@/components/ui/toast";
import { usePageVisible, useReducedMotion } from "../../lib/visibility";
import CapeViewer from "./CapeViewer";
import MinecraftAccountSelect from "./MinecraftAccountSelect";
import MinecraftServerLink from "./MinecraftServerLink";
import MCIDButton from "./MCIDButton";
import SubmissionQuotaBar from "./SubmissionQuotaBar";
import { ToastMessage } from "./ToastMessage";
import { useTranslations } from "../i18n/client";
import { useDuplicateToast } from "../lib/duplicate-toast";
import type { MessageKey } from "../i18n/messages";

const inputClass = "w-full rounded-lg border border-white/15 bg-zinc-950 p-2.5 text-sm focus-visible:outline-2 focus-visible:outline-orange-400";
type Job = { id?: string; status: string; error?: string; error_code?: string; existing_cape_id?: number; cape_id?: number };
interface Props {
  onAccountLinked?: (account: AccountInfo, uuid: string) => void;
  account: AccountInfo; uuid?: string; quota?: SubmissionQuota; replacementId?: number;
  initialName?: string; initialCapeUrl?: string; initialAnimationManifest?: string; disabled?: boolean; onCancel?: () => void; onUploaded?: () => void; onBusyChange?: (busy: boolean) => void;
}

export default function SetupWizard({ account: initialAccount, onAccountLinked, uuid: controlledUuid, quota, replacementId, initialName = "", initialCapeUrl, initialAnimationManifest, disabled = false, onCancel, onUploaded, onBusyChange }: Props) {
  const [updatedAccount, setAccount] = useState<AccountInfo | null>(null);
  const account = updatedAccount ?? initialAccount;
  const { t } = useTranslations();
  const id = useId();
  const [selectedUuid, setUuid] = useState(account.links[0]?.minecraft_uuid ?? "");
  const uuid = controlledUuid ?? (account.links.length === 1 ? account.links[0].minecraft_uuid : selectedUuid);
  const player = account.links.find(link => link.minecraft_uuid === uuid);
  const duplicateToast = useDuplicateToast();
  const reportedDuplicate = useRef<string | undefined>(undefined);
  const firstStep = replacementId !== undefined ? 2 : account.links.length === 1 && player ? 1 : 0;
  const [currentStep, setStep] = useState(0);
  const step = Math.max(firstStep, currentStep);
  const [name, setName] = useState(initialName);
  const [privateCape, setPrivate] = useState(false);
  const [fit, setFit] = useState<"pad" | "crop">("pad");
  const [hd, setHd] = useState(false);
  const [selection, setSelection] = useState<CapeSelection | null>(null);
  const [frames, setFrames] = useState<ComposerFrame[]>([]);
  const [edited, setEdited] = useState(false);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [previewIssue, setPreviewIssue] = useState<MessageKey | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  useEffect(() => {
    if (job?.id && job.status === "failed" && reportedDuplicate.current !== job.id && duplicateToast({ code: job.error_code, existingCapeId: job.existing_cape_id })) reportedDuplicate.current = job.id;
  });
  const [preview, setPreview] = useState<{ canvas: HTMLCanvasElement; revision: number } | null>(null);
  const [poster, setPoster] = useState<string>();
  const posterUrl = useRef<string | null>(null);
  const standard = useRef<HTMLCanvasElement>(null), high = useRef<HTMLCanvasElement>(null);
  const previewRevision = useRef(0), version = useRef(0);
  const ownedImages = useRef(new Set<ImageBitmap>());
  const advancedTrigger = useRef<HTMLButtonElement>(null);
  const draggedFrame = useRef<number | null>(null);
  const timeline = useRef<HTMLDivElement>(null);
  const reportedJob = useRef<string | undefined>(undefined);
  const visible = usePageVisible(), reduced = useReducedMotion();
  const current = frames[Math.min(selected, frames.length - 1)];
  const pending = !!job && ["queued", "processing"].includes(job.status);
  const jobError = replacementId === undefined ? job?.error?.replace(/previous cape retained\.?/gi, t("No cape was uploaded.")) : job?.error;
  const locked = disabled || busy || pending;
  const sourceReady = !!selection || (edited && frames.length > 0);
  const notifyBusy = useEffectEvent((value: boolean) => onBusyChange?.(value));
  const notifyUploaded = useEffectEvent(() => onUploaded?.());
  const clearFrames = useEffectEvent(() => change([], 0, false));
  useEffect(() => { notifyBusy(busy || pending); return () => notifyBusy(false); }, [busy, pending]);
  useEffect(() => {
    if (job?.id && job.status === "complete" && reportedJob.current !== job.id) {
      reportedJob.current = job.id; setStep(0); setName(initialName); setSelection(null); clearFrames(); setPreview(null); setPreviewIssue(null); setPoster(undefined);
      if (posterUrl.current) URL.revokeObjectURL(posterUrl.current); posterUrl.current = null;
      toast.add({ title: t("Your cape was uploaded."), type: "success" });
      notifyUploaded();
    }
  }, [job, initialName, t]);
  useEffect(() => {
    const images = ownedImages.current, generation = version;
    return () => { generation.current++; images.forEach(image => image.close()); images.clear(); if (posterUrl.current) URL.revokeObjectURL(posterUrl.current); };
  }, []);
  useEffect(() => {
    if (!current || !standard.current || !high.current) return;
    drawTemplate(standard.current, current.image, current.image.width, current.image.height, fit, 256, templateWidth(frames, fit, 256));
    drawTemplate(high.current, current.image, current.image.width, current.image.height, fit, 512, templateWidth(frames, fit, 512));
    const canvas = hd ? high.current : standard.current;
    setPreview({ canvas, revision: ++previewRevision.current });
  }, [current, fit, hd, frames]);
  useEffect(() => {
    if (!playing || !visible || reduced || !frames.length) return;
    const durations = frames.map(frame => frame.duration);
    const start = performance.now(), offset = durations.slice(0, selected).reduce((sum, value) => sum + value, 0);
    let request = 0;
    const tick = (now: number) => { setSelected(frameAt(durations, now - start + offset)); request = requestAnimationFrame(tick); };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
    // Selection follows the clock without restarting it on each frame.
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
    if (next.length > 200 || bytes > MAX_SOURCE_BYTES) { setError(t("Maximum 200 frames and 120 MiB of source pixels.")); return; }
    const keep = new Set(next.map(frame => frame.image));
    for (const image of ownedImages.current) if (!keep.has(image)) { image.close(); ownedImages.current.delete(image); }
    next.forEach(frame => ownedImages.current.add(frame.image));
    if (!next.length) setPreview(null);
    setPlaying(false); setFrames(next); setEdited(dirty); setSelected(Math.max(0, Math.min(index, next.length - 1)));
  }
  function acceptImportedFrames(decoded: ComposerFrame[]) {
    const limited = limitFrameRate(decoded);
    const adjusted = limited !== decoded;
    // Own every decoded bitmap before dropping frames so skipped images are released too.
    decoded.forEach(frame => ownedImages.current.add(frame.image));
    change(limited, 0, adjusted);
    if (adjusted) toast.add({ title: t("Your animation was automatically reduced to a maximum of 24 FPS, preserving playback speed."), type: "success" });
    setPlaying(true);
  }
  async function choose(files: File[]) {
    if (locked) return;
    const generation = ++version.current;
    setBusy(true); setError(""); setJob(null); change([], 0, false); setSelection(null); setPreview(null); setPreviewIssue(null); setPoster(undefined);
    if (posterUrl.current) URL.revokeObjectURL(posterUrl.current);
    posterUrl.current = null;
    try {
      let next = await selectCapeFiles(files, "auto", t);
      if (next.mode === "static" && next.files[0].type === "image/png") {
        const size = await inspectImage(next.files[0], t);
        if (!size.width || !size.height || size.width > 4096 || size.height > 4096) throw new Error(t("Static images must not exceed 4096 × 4096 pixels."));
      }
      if (next.mode === "static" && next.files[0].type !== "image/png") {
        const bitmap = await createImageBitmap(next.files[0]);
        try {
          if (!bitmap.width || !bitmap.height || bitmap.width > 4096 || bitmap.height > 4096) throw new Error(t("Static images must not exceed 4096 × 4096 pixels."));
          const canvas = document.createElement("canvas"); canvas.width = bitmap.width; canvas.height = bitmap.height;
          canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
          const blob = await canvasPng(canvas, t); canvas.width = canvas.height = 0;
          if (blob.size > 3 * 1024 * 1024) throw new Error(t("The converted PNG exceeds 3 MiB."));
          next = { ...next, files: [new File([blob], `${next.files[0].name.replace(/\.[^.]+$/, "") || "cape"}.png`, { type: "image/png" })] };
        } finally { bitmap.close(); }
      }
      if (generation !== version.current) return;
      setSelection(next);
      if (next.mode === "static") setAdvanced(false);
      posterUrl.current = URL.createObjectURL(next.files[0]); setPoster(posterUrl.current);
      if (next.mode !== "static") {
        try {
          const decoded = await importFrames(next.files, next.mode, 64, 32, t);
          if (generation !== version.current) { decoded.forEach(frame => frame.image.close()); return; }
          acceptImportedFrames(decoded);
        } catch {
          if (generation === version.current) setPreviewIssue("ImageDecoder" in globalThis
            ? "The animated preview could not be decoded. The original animation can still be uploaded; server validation applies."
            : "Your browser cannot animate this preview. The original animation can still be uploaded; server validation applies.");
        }
      }
    } catch (cause) { if (generation === version.current) setError(cause instanceof Error ? cause.message : t("Import failed.")); }
    finally { if (generation === version.current) setBusy(false); }
  }
  async function loadFrames() {
    if (locked || (!selection && !initialAnimationManifest)) return;
    setBusy(true); setError("");
    const generation = version.current;
    try {
      if (!selection && initialAnimationManifest) {
        const loaded = await importCapeManifest(initialAnimationManifest, t);
        if (generation !== version.current) { new Set(loaded.frames.map(frame => frame.image)).forEach(image => image.close()); return; }
        change(loaded.frames, 0); setHd(loaded.hd); setFit("pad"); setPlaying(true); setPreviewIssue(null);
        return;
      }
      if (!selection) return;
      const next = await importFrames(selection.files, selection.mode === "static" ? "frames" : selection.mode, 64, 32, t);
      if (generation !== version.current) { next.forEach(frame => frame.image.close()); return; }
      acceptImportedFrames(next); setPreviewIssue(null);
    } catch (cause) { if (generation === version.current) setError(cause instanceof Error ? cause.message : t("The frames could not be opened.")); }
    finally { if (generation === version.current) setBusy(false); }
  }
  async function linkMinecraft() {
    setBusy(true); setError("");
    try { window.location.assign(actionValue(await startMinecraftLink()).url); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t("Minecraft could not be linked.")); }
    finally { setBusy(false); }
  }
  async function upload() {
    if (step !== 3 || locked || !sourceReady || !player || !name.trim()) return;
    setBusy(true); setPlaying(false); setError("");
    try {
      const body = new FormData();
      body.set("cape_name", name.trim()); body.set("is_private", String(privateCape));
      if (selection?.mode === "static" && (!edited || frames.length <= 1)) {
        let file = selection.files[0];
        if ((edited && current) || fit !== "pad" || hd) {
          const canvas = document.createElement("canvas");
          const image = current?.image ?? await createImageBitmap(file);
          try { drawTemplate(canvas, image, image.width, image.height, fit, hd ? 512 : 256); }
          finally { if (!current) image.close(); }
          file = new File([await canvasPng(canvas, t)], `${name}.png`, { type: "image/png" }); canvas.width = canvas.height = 0;
        }
        body.set("minecraft_uuid", uuid); body.set("cape", file);
        actionValue(await uploadWebsiteCape(body, replacementId));
        setJob({ status: "complete" }); setStep(0); setName(initialName); setSelection(null); change([], 0, false); setPreview(null); setPreviewIssue(null); setPoster(undefined);
        if (posterUrl.current) URL.revokeObjectURL(posterUrl.current); posterUrl.current = null;
        toast.add({ title: t("Your cape was uploaded."), type: "success" });
        onUploaded?.();
      } else {
        if (edited) {
          if (!frames.length) throw new Error(t("Please keep at least one frame."));
          const canvas = document.createElement("canvas"); let total = 0;
          for (let i = 0; i < frames.length; i++) {
            canvas.width = frames[i].image.width; canvas.height = frames[i].image.height;
            canvas.getContext("2d")!.drawImage(frames[i].image, 0, 0);
            const blob = await canvasPng(canvas, t); total += blob.size;
            if (total > 32 * 1024 * 1024) throw new Error(t("The frames exceed 32 MiB."));
            body.append("files", blob, `frame-${i}.png`);
          }
          canvas.width = canvas.height = 0;
        } else selection?.files.forEach(file => body.append("files", file));
        body.set("minecraft_name", uuid);
        if (replacementId !== undefined) body.set("replacement", String(replacementId));
        body.set("options", JSON.stringify({ mode: edited ? "frames" : selection?.mode, fit, hd, fps: 12, ...(edited ? { durations_ms: frames.map(frame => frame.duration) } : {}) }));
        const response = await fetch("/api/cookiecapes/animations", { method: "POST", body });
        const result = await response.json(); if (!response.ok) throw Object.assign(new Error(result.error), { code: result.code, existingCapeId: result.existingCapeId });
        setJob({ id: result.job_id, status: result.status });
      }
    } catch (cause) { if (!duplicateToast(cause)) setError(cause instanceof Error ? cause.message : t("Upload failed.")); }
    finally { setBusy(false); }
  }
  async function exportFrames() {
    if (!frames.length || locked) return;
    setBusy(true); setError("");
    try {
      const blob = await exportApng(frames, fit, hd ? 512 : 256, t);
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

  return <section aria-labelledby={`${id}-heading`} data-step={step} className="cape-upload relative overflow-hidden rounded-2xl border border-border bg-card">
    {error && <ToastMessage message={error} />}
    {previewIssue && <ToastMessage message={t(previewIssue)} type="info" />}
    {job && job.status !== "complete" && !(job.status === "failed" && job.error_code === "duplicate_cape" && Number.isSafeInteger(job.existing_cape_id) && job.existing_cape_id! > 0) && <ToastMessage key={job.id} message={[job.status === "failed" ? t("The upload was not published.") : t("Your cape is being processed. You can leave this page open."), jobError].filter(Boolean).join(" ")} type={job.status === "failed" || job.error ? "error" : "info"} />}
    <div className="relative border-b border-white/10 p-6 sm:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0"><h2 id={`${id}-heading`} className="font-nexa text-3xl text-white">{replacementId !== undefined ? <>{t("Replace cape image")}: <span className="wrap-anywhere text-orange-300">{initialName}</span></> : t("Upload your own cape!")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">{replacementId !== undefined ? t("Choose a new image and check the 3D preview.") : firstStep === 1 ? t("Name your cape, upload your design, and check the 3D preview.") : t("Choose your account, upload your cape, and check the 3D preview.")}</p>
        </div>
        {quota && <SubmissionQuotaBar quota={quota} />}
      </div>
      <ol aria-label={t("Upload steps")} className={cn("mt-7 grid gap-2 sm:gap-4", firstStep === 2 ? "grid-cols-2" : firstStep === 1 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
        {[t("Account"), t("Name"), t("Design"), t("Upload")].slice(firstStep).map((label, index) => {
          const stepIndex = index + firstStep;
          return <li key={label} aria-current={step === stepIndex ? "step" : undefined} className={cn("flex items-center gap-2 rounded-xl px-2 py-3 text-xs font-medium transition-colors duration-200 motion-reduce:transition-none sm:px-4 sm:text-sm", step === stepIndex ? "bg-orange-500/10 text-orange-300" : "text-zinc-500")}>
            <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 motion-reduce:transition-none", step >= stepIndex ? "border-orange-400/40 text-orange-300" : "border-white/10")}>{step > stepIndex ? <Check size={12} aria-hidden="true" className="animate-in fade-in zoom-in-75 duration-200 motion-reduce:animate-none" /> : index + 1}</span>{label}
          </li>;
        })}
      </ol>
    </div>
    <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_0.8fr]">
      <div className="flex min-w-0 flex-col justify-between gap-8">
        <div key={step} className="animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out motion-reduce:animate-none">
          {step === 0 && <div className="space-y-5">
            <h3 className="text-xl font-bold">{t("Which account owns this cape?")}</h3>
            {account.links.length ? controlledUuid === undefined ? <MinecraftAccountSelect links={account.links} value={uuid} onChange={setUuid} disabled={locked} label={t("Minecraft account for the upload")} /> : player ? <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://minotar.net/helm/${encodeURIComponent(player.minecraft_uuid)}/64`} width={48} height={48} alt={t("Minecraft skin of {name}", { name: player.minecraft_name })} className="rounded-lg [image-rendering:pixelated]" />
              <div><p className="font-bold text-white">{player.minecraft_name}</p><p className="text-xs text-zinc-500">{t("Your active Minecraft account")}</p></div>
            </div> : null : <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm leading-relaxed text-zinc-400">{t("First link your Minecraft account. Then you can upload your cape here.")}</p>
              <div className="flex items-center gap-2">
<MinecraftServerLink account={account} disabled={locked} onLinked={(nextAccount, linkedUuid) => {
                if (onAccountLinked) onAccountLinked(nextAccount, linkedUuid);
                else { setAccount(nextAccount); setUuid(linkedUuid); }
              }} />
              {account.server_link_enabled && account.server_link_address && <p className="max-w-16 shrink-0 text-center text-xs text-zinc-500">{t("or through MC-ID")}</p>}
              <MCIDButton className="min-w-0 flex-1 px-3 text-sm" disabled={locked || !account.mcid_enabled} onClick={() => void linkMinecraft()}>{t("Link with MC-ID")}</MCIDButton>
</div>
              {!account.mcid_enabled && <p className="text-xs text-zinc-500">{t("MC-ID is currently not enabled.")}</p>}
            </div>}
            <p className="text-sm leading-relaxed text-zinc-500">{t("Website uploads receive a blue badge. This verifies identity at upload time, not copyright ownership of the design.")}</p>
          </div>}
          {step === 1 && <div className="space-y-5">
            <h3 className="text-xl font-bold">{t("Cape name")}</h3>
            <input id={`${id}-name`} value={name} maxLength={100} required disabled={locked} onChange={event => setName(event.target.value)} onKeyDown={event => {
              if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
              event.preventDefault();
              if (!locked && player && name.trim()) setStep(2);
            }} placeholder={t("For example: Sunset")} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-orange-400 disabled:opacity-50" />
          </div>}
          {step === 2 && <div className="space-y-5">
            <div className="relative rounded-2xl border border-dashed border-white/20 bg-white/2 p-5 text-center focus-within:ring-2 focus-within:ring-orange-400"
              onDragOver={event => {
                event.preventDefault();
                event.dataTransfer.dropEffect = locked ? "none" : "copy";
              }}
              onDrop={event => {
                event.preventDefault();
                if (locked) return;
                const files = Array.from(event.dataTransfer.files);
                if (files.length) void choose(files);
              }}>
              <Upload size={36} className="mx-auto mb-3 text-orange-400" aria-hidden="true" />
              <p className="break-all text-sm text-muted-foreground" aria-live="polite">{selection ? <>{selection.files[0].name}{selection.files.length > 1 ? t(" + {count} frames", { count: selection.files.length - 1 }) : ""}</> : edited && frames.length ? t("{count} frames", { count: frames.length }) : t("Drop your image here or use the file picker.")}</p>
              <input id={`${id}-file`} type="file" accept="image/*" multiple disabled={locked} aria-label={t("Cape file")} aria-describedby={`${id}-file-help`} className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed" onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ""; if (files.length) void choose(files); }} />
              <p id={`${id}-file-help`} className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("PNG, JPG, GIF, APNG or WebP. Multiple PNGs automatically become an animation. Static images: up to 3 MiB and 4096 × 4096 pixels. Animations: up to 32 MiB, 200 frames and 512 × 300 pixels per frame.")}</p>
              {busy && <p role="status" className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />{t("Preparing your cape…")}</p>}
            </div>
          </div>}
          {step === 3 && <div className="space-y-5">
            <dl className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
              <div><dt className="text-zinc-500">{t("Minecraft account")}</dt><dd className="mt-1 font-bold text-white">{player?.minecraft_name}</dd></div>
              <div><dt className="text-zinc-500">{t("Cape name")}</dt><dd className="mt-1 wrap-break-word font-bold text-white">{name.trim()}</dd></div>
              <div><dt className="text-zinc-500">{selection ? t("File") : t("Current cape animation")}</dt><dd className="mt-1 break-all text-zinc-300">{selection?.files[0].name ?? initialName}</dd></div>
            </dl>
            {replacementId === undefined && <label htmlFor={`${id}-private`} className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white">
              <span>{t("Publish privately")}</span>
              <Switch.Root id={`${id}-private`} checked={privateCape} disabled={locked} onCheckedChange={setPrivate} className="inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-zinc-700 p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50">
                <Switch.Thumb className="block size-5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-5 motion-reduce:transition-none" />
              </Switch.Root>
            </label>}
            <p className="text-sm leading-relaxed text-zinc-400">{t("Check your cape from every angle. Uploading assigns it to your selected Minecraft account.")}</p>
          </div>}
          {step === 2 && <div className="mt-5 flex flex-wrap items-center gap-3">
            {(selection ? selection.mode !== "static" : !!initialAnimationManifest) && <Button ref={advancedTrigger} type="button" variant="outline" disabled={locked} onClick={() => { setAdvanced(true); if (!selection && !frames.length) void loadFrames(); }}>{t("Advanced options")}</Button>}
            {step === 2 && <Button asChild variant="outline"><Link href="/cookiecapes/editor" target="_blank">{t("Design a cape in the editor")} <ArrowRight size={15} aria-hidden="true" /></Link></Button>}
          </div>}
          {step >= 2 && reduced && frames.length > 1 && <p role="status" className="mt-3 text-sm text-zinc-400">{t("Motion is reduced by your system settings. You can scrub through the preview manually.")}</p>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center gap-3">
            {onCancel && <Button size="lg" type="button" variant="outline" disabled={locked} onClick={onCancel}>{t("Cancel")}</Button>}
            {step > firstStep && <Button size="lg" type="button" disabled={locked} onClick={() => setStep(step - 1)} variant="outline"><ArrowLeft size={16} aria-hidden="true" />{t("Back")}</Button>}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {step < 3 ? <Button size="lg" type="button" disabled={locked || !player || (step === 1 && !name.trim()) || (step === 2 && (!sourceReady || (edited && !frames.length)))} onClick={() => setStep(step + 1)}>{t("Next")}<ArrowRight size={16} aria-hidden="true" /></Button> : <Button size="lg" type="button" aria-busy={busy || pending} disabled={locked || !player || !sourceReady || !name.trim() || quota?.remaining === 0 || (edited && !frames.length)} onClick={() => void upload()}>{busy || pending ? <Loader2 data-icon="inline-start" className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Upload data-icon="inline-start" aria-hidden="true" />}{pending ? t("Processing") : busy ? t("Uploading") : replacementId !== undefined ? t("Update Cape") : t("Upload cape")}</Button>}
          </div>
          {error && pending && <Button variant="outline" onClick={() => setJob({ ...job })}>{t("Retry status")}</Button>}
        </div>
      </div>
      <div role="group" aria-label={t("3D preview of {name}", { name: player?.minecraft_name ?? name })} className="cape-upload-preview relative h-96 w-full"><CapeViewer allowElytraSwitch capeUrl={edited && !frames.length ? undefined : poster ?? (!selection && !busy ? initialCapeUrl : undefined)} animationManifest={!selection && !busy && !edited ? initialAnimationManifest : undefined} capeFrame={preview ?? undefined} minecraftName={player?.minecraft_name} animation="idle" />
        {frames.length > 1 && <Button size="sm" type="button" variant="outline" className="absolute top-4 right-4 z-30" disabled={locked || reduced} onClick={() => setPlaying(value => !value)}>{playing && visible ? t("Pause") : t("Play")}</Button>}
      </div>
    </div>
    <Dialog.Root open={advanced} onOpenChange={setAdvanced}>
      <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
        <Dialog.Content onCloseAutoFocus={event => { event.preventDefault(); advancedTrigger.current?.focus(); }} className="account-dialog account-advanced-dialog fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] flex-col w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 text-white">
          <header><div className="mb-3 flex items-start justify-between gap-4"><Dialog.Title className="font-nexa text-2xl">{t("Advanced options")}</Dialog.Title><Dialog.Close asChild><Button variant="outline" aria-label={t("Close advanced options")}>{t("Close")}</Button></Dialog.Close></div>
          <Dialog.Description className="text-sm leading-relaxed text-zinc-400">{t("The defaults work for most capes. You can edit animations frame by frame here.")}</Dialog.Description></header>
          <div className="flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto overscroll-contain p-5 sm:p-7">
            {(selection || initialAnimationManifest) && !frames.length && <div className="flex flex-col gap-2"><Button disabled={locked} variant="outline" onClick={() => void loadFrames()}>{busy ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}{t("Open frames for editing")}</Button>{selection && <p className="text-xs text-zinc-400">{t("This is optional for uploading. Editing animated images requires browser support for ImageDecoder.")}</p>}</div>}
            <div className="account-animation-settings grid grid-cols-2 gap-3"><label className="text-sm">{t("Template")}<select disabled={locked} className={inputClass} value={fit} onChange={e => setFit(e.target.value as typeof fit)}><option value="pad">{t("Pad with transparency")}</option><option value="crop">{t("Crop to center")}</option></select></label><label className="text-sm">{t("Quality")}<select disabled={locked} className={inputClass} value={hd ? "hd" : "standard"} onChange={e => setHd(e.target.value === "hd")}><option value="standard">{t("Standard · up to 256 × 128")}</option><option value="hd">{t("HD · up to 512 × 256")}</option></select></label></div>
            {current && <div className="grid grid-cols-2 gap-4"><FramePreview frame={current} frames={frames} fit={fit} maximum={256} label="Standard" /><FramePreview frame={current} frames={frames} fit={fit} maximum={512} label="HD" /></div>}
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
                    className={cn("w-24 shrink-0 cursor-grab rounded-lg border-2 p-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50", selected === index ? "border-orange-400 bg-orange-400/10 text-orange-300" : "border-transparent bg-zinc-900 text-zinc-400")}
                    onClick={() => { setPlaying(false); setSelected(index); }}
                    onDragStart={event => { draggedFrame.current = index; setPlaying(false); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(index)); }}
                    onDragEnd={() => { draggedFrame.current = null; }}
                    onDragOver={event => { if (!locked && draggedFrame.current !== null) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }}
                    onDrop={event => { event.preventDefault(); if (draggedFrame.current !== null) reorder(draggedFrame.current, index); draggedFrame.current = null; }}
                    onKeyDown={event => { if (event.altKey && ["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); reorder(index, index + (event.key === "ArrowLeft" ? -1 : 1)); } }}>
                    <FrameThumbnail frame={frame} fit={fit} />
                    <span className="mt-1 block">{index + 1} · {Math.round(frame.duration)} ms</span>
                  </button>
                </ContextMenu.Trigger>
                <ContextMenu.Portal><ContextMenu.Content className="account-popup z-60 min-w-36 rounded-lg border border-white/15 bg-zinc-950 p-1 text-sm text-white shadow-xl">
                  <ContextMenu.Item disabled={locked || frames.length >= 200} className="cursor-pointer rounded px-3 py-2 outline-none data-highlighted:bg-white/10 data-disabled:opacity-40" onSelect={() => change([...frames.slice(0, index + 1), { ...frame }, ...frames.slice(index + 1)], index + 1)}>{t("Duplicate")}</ContextMenu.Item>
                  <ContextMenu.Item disabled={locked} className="cursor-pointer rounded px-3 py-2 text-red-300 outline-none data-highlighted:bg-white/10 data-disabled:opacity-40" onSelect={() => change(frames.filter((_, item) => item !== index), index)}>{t("Delete")}</ContextMenu.Item>
                </ContextMenu.Content></ContextMenu.Portal>
              </ContextMenu.Root>)}
            </div>
            <Button disabled={!frames.length || locked || reduced} onClick={() => setPlaying(value => !value)}>{playing && visible ? t("Pause") : t("Play")}</Button>
            <label className="block text-sm">{t("Frame duration (42–60,000 ms)")}<input className={inputClass} type="number" min={1000 / 24} max={60000} step="any" value={Number((current?.duration ?? 1000 / 12).toFixed(2))} disabled={!current || locked} onChange={event => { const duration = Number(event.target.value); if (duration >= 1000 / 24 && duration <= 60000) change(frames.map((frame, index) => index === selected ? { ...frame, duration } : frame), selected); }} /></label>
            <div className="flex flex-wrap gap-2">{[6, 12, 24].map(fps => <Button key={fps} variant="outline" disabled={!frames.length || locked} onClick={() => change(frames.map(frame => ({ ...frame, duration: 1000 / fps })), selected)}>{t("All: {fps} FPS", { fps })}</Button>)}</div>
            {reduced && <p className="text-sm text-zinc-400">{t("Motion is reduced by your system settings. You can scrub through the preview manually.")}</p>}

          </div><footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-white/10">
              <Button type="button" variant="outline" disabled={locked || !frames.length} onClick={() => void exportFrames()}>{t("Export as APNG")}</Button>
              <Button type="button" disabled={locked || !frames.length} onClick={() => { setEdited(true); setAdvanced(false); }}>{t("Apply changes")}</Button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    <div hidden><canvas ref={standard} /><canvas ref={high} /></div>
  </section>;
}

function FrameThumbnail({ frame, fit }: { frame: ComposerFrame; fit: "pad" | "crop" }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current) drawTemplate(canvas.current, frame.image, frame.image.width, frame.image.height, fit, 64);
  }, [frame, fit]);
  return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none aspect-2/1 w-full rounded bg-zinc-800 [image-rendering:pixelated]" />;
}

function FramePreview({ frame, frames, fit, maximum, label }: { frame: ComposerFrame; frames: ComposerFrame[]; fit: "pad" | "crop"; maximum: number; label: string }) {
  const { t } = useTranslations();
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current) drawTemplate(canvas.current, frame.image, frame.image.width, frame.image.height, fit, maximum, templateWidth(frames, fit, maximum));
  }, [frame, frames, fit, maximum]);
  return <figure><canvas ref={canvas} aria-label={t("{quality} preview", { quality: label })} className="aspect-2/1 w-full rounded-lg border border-white/15 bg-zinc-900 [image-rendering:pixelated]" /><figcaption className="mt-2 text-xs text-zinc-400">{label}</figcaption></figure>;
}
