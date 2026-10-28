"use client";
import { useTranslations } from "@/app/cookiecapes/i18n/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { selectMinecraftProfiles } from "@/app/actions/account-actions";
import { actionValue } from "../lib/account-types";
import type { MinecraftProfile } from "../lib/account-types";
import { MinecraftAvatar } from "../components/MinecraftAccountSelect";
import { toast } from "@/components/ui/toast";
export default function ProfileSelection({ state, profiles }: { state: string; profiles: MinecraftProfile[] }) {
  const { t } = useTranslations();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return <form onSubmit={async event => {
    event.preventDefault();
    if (busy || !selected.length) return;
    setBusy(true);
    try { actionValue(await selectMinecraftProfiles(state, selected)); toast.add({ title: t("Your Minecraft accounts have been linked."), type: "success" }); router.push("/cookiecapes/account"); router.refresh(); }
    catch (e) { toast.add({ title: e instanceof Error ? e.message : t("Linking failed."), type: "error" }); }
    finally { setBusy(false); }
  }} className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 sm:p-10"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-400">{t("Your Minecraft identity")}</p><h1 className="font-nexa text-3xl mb-6">{t("Select Minecraft accounts")}</h1>
    <p className="text-zinc-400 mb-6">{t("These accounts were verified by MC-ID. Choose the accounts you want to link to your CookieCapes account.")}</p>
    <div className="grid gap-3 sm:grid-cols-2">{profiles.map(profile => <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${selected.includes(profile.uuid) ? "border-orange-400/50 bg-orange-500/10" : "border-white/10 bg-black/20"}`} key={profile.uuid}>
      <input type="checkbox" disabled={busy} className="h-4 w-4 shrink-0 accent-orange-500 focus-visible:outline-2 focus-visible:outline-orange-400" checked={selected.includes(profile.uuid)} onChange={event => setSelected(event.target.checked ? [...selected, profile.uuid] : selected.filter(uuid => uuid !== profile.uuid))} />
      <MinecraftAvatar uuid={profile.uuid} name={profile.username} />
      <span className="min-w-0"><span className="block truncate font-bold">{profile.username}</span><span className="block text-xs text-zinc-500">{t("Verified by MC-ID")}</span></span>
    </label>)}</div>
    {profiles.length === 0 && <p>{t("MC-ID did not return any verified Minecraft accounts.")}</p>}
    <Button size="lg" type="submit" disabled={busy || !selected.length} className="mt-6">{busy ? t("Linking…") : t("Link selected accounts")}</Button>
  </form>;
}
