"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { selectMinecraftProfiles } from "@/app/actions/account-actions";
import { actionValue } from "../lib/account-types";
import type { MinecraftProfile } from "../lib/account-types";
import { MinecraftAvatar } from "../components/MinecraftAccountSelect";
import { toast } from "@/components/ui/toast";
export default function ProfileSelection({ state, profiles }: { state: string; profiles: MinecraftProfile[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return <form onSubmit={async event => {
    event.preventDefault();
    if (busy || !selected.length) return;
    setBusy(true);
    try { actionValue(await selectMinecraftProfiles(state, selected)); toast.add({ title: "Deine Minecraft-Accounts wurden verknüpft.", type: "success" }); router.push("/cookiecapes/account"); router.refresh(); }
    catch (e) { toast.add({ title: e instanceof Error ? e.message : "Verknüpfung fehlgeschlagen.", type: "error" }); }
    finally { setBusy(false); }
  }} className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 sm:p-10"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Deine Minecraft-Identität</p><h1 className="font-nexa text-3xl mb-6">Minecraft-Accounts auswählen</h1>
    <p className="text-zinc-400 mb-6">Diese Accounts wurden durch MC-ID bestätigt. Wähle die Accounts, die du mit deinem CookieCapes Account verbinden möchtest.</p>
    <div className="grid gap-3 sm:grid-cols-2">{profiles.map(profile => <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${selected.includes(profile.uuid) ? "border-orange-400/50 bg-orange-500/10" : "border-white/10 bg-black/20"}`} key={profile.uuid}>
      <input type="checkbox" disabled={busy} className="h-4 w-4 shrink-0 accent-orange-500 focus-visible:outline-2 focus-visible:outline-orange-400" checked={selected.includes(profile.uuid)} onChange={event => setSelected(event.target.checked ? [...selected, profile.uuid] : selected.filter(uuid => uuid !== profile.uuid))} />
      <MinecraftAvatar uuid={profile.uuid} name={profile.username} />
      <span className="min-w-0"><span className="block truncate font-bold">{profile.username}</span><span className="block text-xs text-zinc-500">Mit MC-ID bestätigt</span></span>
    </label>)}</div>
    {profiles.length === 0 && <p>MC-ID hat keine bestätigten Minecraft-Accounts geliefert.</p>}
    <Button size="lg" type="submit" disabled={busy || !selected.length} className="mt-6">{busy ? "Wird verknüpft…" : "Auswahl verknüpfen"}</Button>
  </form>;
}
