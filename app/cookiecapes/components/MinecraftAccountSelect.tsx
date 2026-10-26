"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import type { AccountInfo } from "../lib/account-types";

export function MinecraftAvatar({ uuid, name, className = "h-12 w-12" }: { uuid: string; name: string; className?: string }) {
  return <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-zinc-800 font-bold text-zinc-400 ${className}`}>
    <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`https://minotar.net/helm/${encodeURIComponent(uuid.replaceAll("-", ""))}/64`} alt={`Minecraft-Kopf von ${name}`} width={64} height={64} className="absolute inset-0 h-full w-full [image-rendering:pixelated]" onError={event => { event.currentTarget.style.visibility = "hidden"; }} />
  </span>;
}

export default function MinecraftAccountSelect({ links, value, onChange, disabled, label = "Aktiver Minecraft-Account" }: { links: AccountInfo["links"]; value: string; onChange: (uuid: string) => void; disabled?: boolean; label?: string }) {
  const name = useId();
  return <fieldset disabled={disabled}>
    <legend className="mb-3 text-sm font-semibold text-zinc-300">{label}</legend>
    <div className="grid gap-3 sm:grid-cols-2">
      {links.map(link => <label key={link.minecraft_uuid} className={`relative flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-orange-400 ${disabled ? "cursor-wait opacity-50" : "hover:border-orange-400/50"} ${value === link.minecraft_uuid ? "border-orange-500/60 bg-orange-500/10" : "border-white/10 bg-black/20"}`}>
        <input type="radio" name={name} value={link.minecraft_uuid} checked={value === link.minecraft_uuid} onChange={() => onChange(link.minecraft_uuid)} className="peer sr-only" />
        <MinecraftAvatar uuid={link.minecraft_uuid} name={link.minecraft_name} />
        <span className="min-w-0 flex-1"><span className="block truncate font-bold text-white">{link.minecraft_name}</span><span className="block text-xs text-zinc-500">{value === link.minecraft_uuid ? "Ausgewählt" : "Minecraft Java"}</span></span>
        {value === link.minecraft_uuid && <Check size={18} aria-hidden="true" className="shrink-0 text-orange-400" />}
      </label>)}
    </div>
  </fieldset>;
}
