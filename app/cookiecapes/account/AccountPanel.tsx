"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { claimCape, loadOwnedCapes, reviewLegacyCapes, startMinecraftLink } from "@/app/actions/account-actions";
import { actionValue } from "../lib/account-types";
import type { AccountInfo, OwnedCapes } from "../lib/account-types";
import CapeViewer from "../components/CapeViewer";
import MCIDButton from "../components/MCIDButton";
import MinecraftAccountSelect from "../components/MinecraftAccountSelect";
import SetupWizard from "../components/SetupWizard";
import { toast } from "@/components/ui/toast";
import VerificationBadge from "../components/VerificationBadge";


export default function AccountPanel({ account }: { account: AccountInfo }) {
  const [uuid, setUuid] = useState(account.links[0]?.minecraft_uuid ?? "");
  const [owned, setOwned] = useState<OwnedCapes | null>(null);
  const [ownedError, setOwnedError] = useState(false);
  const [keepIds, setKeepIds] = useState<number[]>([]);
  const [confirmReview, setConfirmReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const selectedAccount = account.links.find(link => link.minecraft_uuid === uuid);
  const controlsDisabled = busy || uploadBusy;

  useEffect(() => {
    let active = true;
    if (uuid) loadOwnedCapes(uuid).then(data => {
      if (!active) return;
      const value = actionValue(data);
      setOwned(value);
      setKeepIds((value.review?.snapshot ?? []).map(cape => cape.cape_id));
    }).catch(error => {
      if (!active) return;
      setOwnedError(true);
      toast.add({ title: error instanceof Error ? error.message : "Capes konnten nicht geladen werden.", type: "error" });
    });
    return () => { active = false; };
  }, [uuid, refresh]);

  function reloadCapes() {
    setOwned(null);
    setOwnedError(false);
    setKeepIds([]);
    setConfirmReview(false);
    setRefresh(value => value + 1);
  }

  async function run(action: () => Promise<void>, message: string) {
    setBusy(true);
    try {
      await action();
      toast.add({ title: message, type: "success" });
      reloadCapes();
    } catch (error) {
      toast.add({ title: error instanceof Error ? error.message : "Die Anfrage ist fehlgeschlagen. Bitte versuche es erneut.", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  const candidates = new Set(owned?.review?.snapshot.map(cape => cape.cape_id) ?? []);
  return <div className="space-y-10">
    <section aria-labelledby="minecraft-accounts-title" className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60">
      <div className="grid lg:grid-cols-[1fr_1.3fr]">
        <div className="border-b border-white/10 bg-linear-to-br from-orange-500/10 to-transparent p-6 sm:p-8 lg:border-r lg:border-b-0">
          <h2 id="minecraft-accounts-title" className="font-nexa text-2xl sm:text-3xl">Minecraft-Accounts</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">Deine Spieler, deine Sammlung. Verbinde deine Minecraft-Accounts mit MC-ID und verwalte für jeden Spieler eigene Capes.</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-zinc-300">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{account.links.length} {account.links.length === 1 ? "Account verknüpft" : "Accounts verknüpft"}</span>
            {selectedAccount && <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-orange-300">Aktiv: {selectedAccount.minecraft_name}</span>}
          </div>
        </div>
        <div className="space-y-5 p-6 sm:p-8">
          {account.links.length > 0 ? <MinecraftAccountSelect links={account.links} value={uuid} disabled={controlsDisabled} onChange={nextUuid => { setUuid(nextUuid); reloadCapes(); }} /> : <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm leading-relaxed text-zinc-400">Noch kein Minecraft-Account verknüpft. Verbinde deinen ersten Account, um Capes hochzuladen.</div>}
          <MCIDButton disabled={controlsDisabled || !account.mcid_enabled} onClick={() => run(async () => { const result = actionValue(await startMinecraftLink()); window.location.assign(result.url); }, "Weiter zu MC-ID…")}>Mit MC-ID verknüpfen</MCIDButton>
          {!account.mcid_enabled && <p className="text-xs leading-relaxed text-zinc-500">Die MC-ID-Verknüpfung ist noch nicht freigeschaltet. Bitte versuche es später erneut.</p>}
        </div>
      </div>
    </section>

    <SetupWizard account={account} uuid={uuid} disabled={busy} onUploaded={reloadCapes} onBusyChange={setUploadBusy} />

    {uuid && <section aria-labelledby="owned-capes-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="owned-capes-title" className="font-nexa text-3xl">Deine Capes</h2>
          <p className="mt-2 text-sm text-zinc-400">Hier kannst du all deine Capes direkt verwalten.</p>
        </div>
        {owned && <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400">{owned.capes.length} {owned.capes.length === 1 ? "Cape" : "Capes"}</span>}
      </div>
      {!owned && !ownedError && <div role="status" className="rounded-2xl border border-white/10 bg-zinc-900/40 p-8 text-center text-zinc-400">Capes werden geladen…</div>}
      {ownedError && <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 text-center"><Button size="lg" disabled={controlsDisabled} variant="outline" onClick={reloadCapes}>Erneut laden</Button></div>}
      {owned && <>
        {candidates.size > 0 && <div className="space-y-4 rounded-2xl border border-blue-400/20 bg-blue-500/5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold">Bisherige Uploads prüfen</h3><span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-300">{keepIds.length} behalten · {candidates.size - keepIds.length} entfernen</span></div>
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-400">Wähle die Capes aus, die du übernehmen möchtest. Nicht ausgewählte Capes werden erst nach deiner Bestätigung verborgen und nach 30 Tagen dauerhaft gelöscht. Bis dahin kannst du sie hier wiederherstellen.</p>
          {!confirmReview && <Button size="lg" disabled={controlsDisabled} onClick={() => setConfirmReview(true)} variant="outline">Auswahl prüfen</Button>}
          {confirmReview && <div role="alertdialog" aria-labelledby="confirm-review-title" aria-describedby="confirm-review-description" className="space-y-4 rounded-xl border border-orange-400/40 bg-black/30 p-5">
            <h4 id="confirm-review-title" className="font-bold">Cape-Auswahl bestätigen</h4>
            <p id="confirm-review-description" className="text-sm leading-relaxed text-zinc-300">Verbindlich bestätigen: {keepIds.length} Capes übernehmen und {candidates.size - keepIds.length} Capes verbergen?</p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" disabled={controlsDisabled} onClick={() => run(async () => { actionValue(await reviewLegacyCapes(owned.review!.id, keepIds)); }, "Deine Auswahl wurde gespeichert. Verborgene Capes sind 30 Tage wiederherstellbar.")}>Auswahl bestätigen</Button>
              <Button size="lg" autoFocus disabled={controlsDisabled} variant="outline" onClick={() => setConfirmReview(false)}>Abbrechen</Button>
            </div>
          </div>}
        </div>}
        {!owned.capes.length && <div className="rounded-2xl border border-dashed border-white/15 py-14 text-center"><h3 className="text-lg font-bold">Platz für dein erstes Cape</h3><p className="mt-2 text-sm text-zinc-400">Für diesen Account gibt es noch keine Capes. Starte oben mit dem Upload.</p></div>}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{owned.capes.map(cape => <article key={cape.cape_id} className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
          <div className="relative h-72 bg-linear-to-b from-white/5 to-transparent" role="group" aria-label={`3D-Vorschau von ${cape.cape_name}`}>
            <CapeViewer capeUrl={`/cookiecapes/account/images/${cape.cape_id}?v=${refresh}`} minecraftName={selectedAccount?.minecraft_name} />
            <span className="pointer-events-none absolute top-4 left-4 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-zinc-400">#{cape.cape_id}</span>
            {cape.hidden_at && <span className="pointer-events-none absolute top-4 right-4 rounded-lg border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300">Verborgen</span>}
          </div>
          <div className="space-y-4 border-t border-white/5 p-5">
            <h3 className="flex items-center gap-2 font-bold"><span className="truncate">{cape.cape_name}</span><VerificationBadge verification={cape.verification} /></h3>
            {candidates.has(cape.cape_id) && <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-blue-400/20 bg-blue-500/5 p-3 text-sm text-blue-200"><input type="checkbox" className="h-4 w-4 accent-blue-500" disabled={controlsDisabled || confirmReview} checked={keepIds.includes(cape.cape_id)} onChange={event => setKeepIds(event.target.checked ? [...keepIds, cape.cape_id] : keepIds.filter(id => id !== cape.cape_id))} /> Behalten und blau bestätigen</label>}
            {cape.hidden_at ? <>
              <p className="text-xs leading-relaxed text-orange-300/80">Verborgen. Löschung: {cape.delete_after ? new Date(cape.delete_after).toLocaleString("de-DE") : "ausstehend"}</p>
              <Button size="lg" disabled={controlsDisabled} onClick={() => run(async () => { actionValue(await claimCape(cape.cape_id, true)); }, "Cape wiederhergestellt und bestätigt.")} variant="outline" className="w-full">Wiederherstellen</Button>
            </> : !candidates.has(cape.cape_id) && cape.verification !== "website" ? <Button size="lg" disabled={controlsDisabled} onClick={() => run(async () => { actionValue(await claimCape(cape.cape_id)); }, "Cape übernommen und blau bestätigt.")} variant="outline" className="w-full">Übernehmen und blau bestätigen</Button> : null}
          </div>
        </article>)}</div>
        <p className="text-xs leading-relaxed text-zinc-500">Häkchen bestätigen die Identität beim Upload oder bei der Übernahme, kein Urheberrecht am Design.</p>
      </>}
    </section>}
  </div>;
}
