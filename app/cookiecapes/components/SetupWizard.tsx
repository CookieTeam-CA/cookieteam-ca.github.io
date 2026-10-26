"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, FileImage, Upload } from "lucide-react";
import { startMinecraftLink, uploadWebsiteCape } from "@/app/actions/account-actions";
import { actionValue, type AccountInfo } from "../lib/account-types";
import CapeViewer from "./CapeViewer";
import MinecraftAccountSelect from "./MinecraftAccountSelect";
import MCIDButton from "./MCIDButton";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";


interface SetupWizardProps {
  account: AccountInfo;
  uuid?: string;
  onUploaded?: () => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}

export default function SetupWizard({ account, uuid: controlledUuid, onUploaded, disabled = false, onBusyChange }: SetupWizardProps) {
  const id = useId();
  const [selectedUuid, setSelectedUuid] = useState(account.links[0]?.minecraft_uuid ?? "");
  const uuid = controlledUuid ?? (account.links.length === 1 ? account.links[0].minecraft_uuid : selectedUuid);
  const player = account.links.find(link => link.minecraft_uuid === uuid);
  const firstStep = account.links.length === 1 && player ? 1 : 0;
  const [currentStep, setStep] = useState(0);
  const step = Math.max(firstStep, currentStep);
  const [capeName, setCapeName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const reader = useRef<FileReader | null>(null);
  const previewUrl = useRef<string | null>(null);
  const fileVersion = useRef(0);
  const locked = disabled || busy;

  useEffect(() => () => {
    fileVersion.current += 1;
    reader.current?.abort();
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
  }, []);

  function selectFile(next: File | null) {
    const version = ++fileVersion.current;
    reader.current?.abort();
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    setFile(null);
    setPreview("");
    setChecking(false);
    if (!next) return;
    if (next.size === 0 || next.size > 3 * 1024 * 1024 || (next.type && !next.type.startsWith("image/"))) {
      toast.add({ title: "Bitte wähle eine Bilddatei mit maximal 3 MB.", type: "error" });
      return;
    }
    setChecking(true);
    const currentReader = new FileReader();
    reader.current = currentReader;
    let failureMessage = "Das Bild konnte nicht gelesen oder in PNG umgewandelt werden. Bitte wähle ein vom Browser unterstütztes Bildformat.";
    const fail = () => {
      if (version !== fileVersion.current) return;
      setChecking(false);
      toast.add({ title: failureMessage, type: "error" });
    };
    currentReader.onerror = fail;
    currentReader.onload = async () => {
      try {
        const result = String(currentReader.result);
        const isPng = atob(result.split(",")[1]).slice(0, 8) === "\x89PNG\r\n\x1a\n";
        const image = new Image();
        image.src = result;
        await image.decode();
        if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > 4096 || image.naturalHeight > 4096) {
          failureMessage = "Das Bild darf maximal 4096 × 4096 Pixel groß sein.";
          throw new Error("Invalid dimensions");
        }
        if (version !== fileVersion.current) return;
        const pngName = `${next.name.replace(/\.[^.]+$/, "") || "cape"}.png`;
        if (isPng) {
          setFile(next.type === "image/png" && next.name.toLowerCase().endsWith(".png") ? next : new File([next], pngName, { type: "image/png" }));
          setPreview(result);
        } else {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas unavailable");
          context.drawImage(image, 0, 0);
          const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("PNG conversion failed")), "image/png"));
          if (version !== fileVersion.current) return;
          if (!png.size) throw new Error("Empty PNG");
          if (png.size > 3 * 1024 * 1024) {
            failureMessage = "Die umgewandelte PNG-Datei ist größer als 3 MB. Bitte wähle ein kleineres Bild.";
            throw new Error("PNG too large");
          }
          const converted = new File([png], pngName, { type: "image/png" });
          previewUrl.current = URL.createObjectURL(converted);
          setFile(converted);
          setPreview(previewUrl.current);
        }
        setChecking(false);
      } catch { fail(); }
    };
    currentReader.readAsDataURL(next);
  }

  async function linkMinecraft() {
    setBusy(true);
    onBusyChange?.(true);
    try { window.location.assign(actionValue(await startMinecraftLink()).url); }
    catch (error) { toast.add({ title: error instanceof Error ? error.message : "Minecraft konnte nicht verknüpft werden.", type: "error" }); }
    finally { setBusy(false); onBusyChange?.(false); }
  }

  async function upload() {
    if (locked || checking || !player || !file || !preview || !capeName.trim()) return;
    setBusy(true);
    onBusyChange?.(true);
    const data = new FormData();
    data.set("minecraft_uuid", uuid);
    data.set("cape_name", capeName.trim());
    data.set("cape", file);
    try {
      actionValue(await uploadWebsiteCape(data));
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
      setFile(null);
      setPreview("");
      setCapeName("");
      setStep(0);
      if (fileInput.current) fileInput.current.value = "";
      toast.add({ title: "Dein Cape wurde hochgeladen und blau bestätigt.", type: "success" });
      onUploaded?.();
    } catch (error) { toast.add({ title: error instanceof Error ? error.message : "Der Upload ist fehlgeschlagen. Bitte versuche es erneut.", type: "error" }); }
    finally { setBusy(false); onBusyChange?.(false); }
  }

  return <section aria-labelledby={`${id}-heading`} className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#101010]">
    <div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
    <div className="relative border-b border-white/10 p-6 sm:p-8">
      <h2 id={`${id}-heading`} className="font-nexa text-3xl text-white">Lade dein eigenes Cape hoch!</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">{firstStep === 1 ? "Gib deinem Cape einen Namen, lade dein Design hoch und überprüfe die 3D Ansicht." : "Wähle deinen Account, lade dein Cape hoch und überprüfe die 3D Ansicht."} Pro Account ist ein Upload pro Tag möglich.</p>
      <ol aria-label="Upload-Schritte" className={cn("mt-7 grid gap-2 sm:gap-4", firstStep === 1 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
        {["Account", "Name", "Design", "Hochladen"].slice(firstStep).map((label, index) => {
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
          <h3 className="text-xl font-bold">Welchem Account gehört das Cape?</h3>
          {account.links.length ? controlledUuid === undefined ? <MinecraftAccountSelect links={account.links} value={uuid} onChange={setSelectedUuid} disabled={locked} label="Minecraft-Account für den Upload" /> : player ? <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://minotar.net/helm/${encodeURIComponent(player.minecraft_uuid)}/64`} width={48} height={48} alt={`Minecraft-Skin von ${player.minecraft_name}`} className="rounded-lg [image-rendering:pixelated]" />
            <div><p className="font-bold text-white">{player.minecraft_name}</p><p className="text-xs text-zinc-500">Dein aktiver Minecraft-Account</p></div>
          </div> : null : <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm leading-relaxed text-zinc-400">Verknüpfe zuerst deinen Minecraft-Account mit MC-ID. Danach kannst du dein Cape direkt hier hochladen.</p>
            <MCIDButton disabled={locked || !account.mcid_enabled} onClick={() => void linkMinecraft()}>Mit MC-ID verknüpfen</MCIDButton>
            {!account.mcid_enabled && <p className="text-xs text-zinc-500">MC-ID ist momentan nicht freigeschaltet.</p>}
          </div>}
          <p className="text-sm leading-relaxed text-zinc-500">Uploads über die Website erhalten ein blauen Haken. Dies bestätigt die Identität beim Upload, keine Urheberrecht am Design.</p>
        </div>}
        {step === 1 && <div className="space-y-5">
          <h3 className="text-xl font-bold">Gib deinem Cape einen Namen.</h3>
          <label className="block text-sm font-medium text-zinc-300" htmlFor={`${id}-name`}>Cape-Name</label>
          <input id={`${id}-name`} value={capeName} maxLength={100} required disabled={locked} onChange={event => setCapeName(event.target.value)} placeholder="Zum Beispiel: Sonnenuntergang" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-orange-400 disabled:opacity-50" />
        </div>}
        {step === 2 && <div className="space-y-5">
          <h3 className="text-xl font-bold">Lade dein Cape hoch.</h3>
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/2 p-5"
            onDragOver={event => {
              event.preventDefault();
              event.dataTransfer.dropEffect = locked ? "none" : "copy";
            }}
            onDrop={event => {
              event.preventDefault();
              if (locked) return;
              const droppedFile = event.dataTransfer.files[0];
              if (droppedFile) selectFile(droppedFile);
            }}>
            <FileImage size={24} className="mb-3 text-orange-400" aria-hidden="true" />
            <p className="mb-3 text-sm text-muted-foreground">Ziehe dein Bild hierher oder nutze die Dateiauswahl.</p>
            <Button type="button" variant="outline" disabled={locked} aria-describedby={`${id}-file-help`} onClick={() => fileInput.current?.click()}>Cape auswählen</Button>
            <input ref={fileInput} id={`${id}-file`} type="file" accept="image/*" disabled={locked} aria-label="Cape-Datei" onChange={event => selectFile(event.target.files?.[0] ?? null)} hidden />
            <p id={`${id}-file-help`} className="mt-3 text-xs leading-relaxed text-muted-foreground">PNG: maximal 3 MB · bis zu 4096 × 4096 Pixel. Andere Bildformate wenn möglich On-Device in PNG umgewandelt. Animierte Bilder werden als Einzelbild übernommen.</p>
            {checking && <p role="status" className="mt-3 text-xs text-muted-foreground">Dein Bild wird geprüft und bei Bedarf in PNG umgewandelt…</p>}
            {file && <p className="mt-3 break-all text-xs text-zinc-300">Ausgewählt: {file.name}</p>}
          </div>
          <Button asChild variant="outline" className="w-full"><Link href="/cookiecapes/editor" target="_blank">Cape im Editor gestalten <ArrowRight size={15} aria-hidden="true"/></Link></Button>
        </div>}
        {step === 3 && <div className="space-y-5">
          <h3 className="text-xl font-bold">Bereit für deinen neuen Look?</h3>
          <dl className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
            <div><dt className="text-zinc-500">Minecraft-Account</dt><dd className="mt-1 font-bold text-white">{player?.minecraft_name}</dd></div>
            <div><dt className="text-zinc-500">Cape-Name</dt><dd className="mt-1 wrap-break-word font-bold text-white">{capeName.trim()}</dd></div>
            <div><dt className="text-zinc-500">Datei</dt><dd className="mt-1 break-all text-zinc-300">{file?.name}</dd></div>
          </dl>
          <p className="text-sm leading-relaxed text-zinc-400">Prüfe dein Cape von allen Seiten. Mit dem Upload wird es deinem ausgewählten Minecraft-Account zugeordnet.</p>
        </div>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          {step > firstStep ? <Button size="lg" type="button" disabled={locked} onClick={() => setStep(step - 1)} variant="outline"><ArrowLeft size={16} aria-hidden="true" />Zurück</Button> : <span aria-hidden="true" />}
          {step < 3 ? <Button size="lg" type="button" disabled={locked || !player || (step === 1 && !capeName.trim()) || (step === 2 && (!file || !preview || checking))} onClick={() => setStep(step + 1)}>Weiter<ArrowRight size={16} aria-hidden="true" /></Button> : <Button size="lg" type="button" disabled={locked || !player || !file || !preview || !capeName.trim()} onClick={() => void upload()}><Upload size={16} aria-hidden="true" />{busy ? "Wird hochgeladen…" : "Cape hochladen"}</Button>}
        </div>
      </div>
      <div role="group" aria-label={`3D-Vorschau${player ? ` von ${player.minecraft_name}` : " deines Capes"}`} className="h-96 w-full"><CapeViewer capeUrl={preview || null} minecraftName={player?.minecraft_name} animation="idle" /></div>
    </div>
  </section>;
}
