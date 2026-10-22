"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { selectMinecraftProfiles } from "@/app/actions/account-actions";
import { actionValue } from "../lib/account-types";
import type { MinecraftProfile } from "../lib/account-types";
export default function ProfileSelection({ state, profiles }: { state: string; profiles: MinecraftProfile[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return <form onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError("");
    try { actionValue(await selectMinecraftProfiles(state, selected)); router.push("/cookiecapes/account"); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Verknüpfung fehlgeschlagen."); }
    finally { setBusy(false); }
  }}><h1 className="text-3xl font-bold mb-6">Minecraft-Accounts auswählen</h1>
    <p className="text-zinc-400 mb-6">Diese Accounts wurden durch MC-ID bestätigt. Wähle die Accounts, die du mit deinem CookieCapes Account verbinden möchtest.</p>
    {profiles.map(profile => <label className="block border border-white/10 rounded p-4 mb-3" key={profile.uuid}><input type="checkbox" checked={selected.includes(profile.uuid)} onChange={event => setSelected(event.target.checked ? [...selected, profile.uuid] : selected.filter(uuid => uuid !== profile.uuid))} /> <span>{profile.username}</span><span className="block text-xs text-zinc-500">{profile.uuid}</span></label>)}
    {profiles.length === 0 && <p>MC-ID hat keine bestätigten Minecraft-Accounts geliefert.</p>}
    <p role="alert" className="text-red-400">{error}</p>
    <button disabled={busy || !selected.length} className="bg-orange-600 rounded px-5 py-3 mt-4 disabled:opacity-40">{busy ? "Wird verknüpft…" : "Auswahl verknüpfen"}</button>
  </form>;
}
