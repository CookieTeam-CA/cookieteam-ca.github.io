"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { claimCape, loadOwnedCapes, reviewLegacyCapes, startMinecraftLink, uploadWebsiteCape } from "@/app/actions/account-actions";
import { actionValue } from "../lib/account-types";
import type { AccountInfo, OwnedCapes } from "../lib/account-types";
import VerificationBadge from "../components/VerificationBadge";

const buttonClass = "rounded-lg bg-orange-600 px-5 py-3 disabled:opacity-40";
export default function AccountPanel({ account }: { account: AccountInfo }) {
  const [uuid, setUuid] = useState(account.links[0]?.minecraft_uuid ?? "");
  const [owned, setOwned] = useState<OwnedCapes | null>(null);
  const [ownedError, setOwnedError] = useState(false);
  const [keepIds, setKeepIds] = useState<number[]>([]);
  const [confirmReview, setConfirmReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [capeName, setCapeName] = useState("");
  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file]);
  useEffect(() => {
    let active = true;
    if (uuid) loadOwnedCapes(uuid).then(data => {
      if (active) { const value = actionValue(data); setOwned(value); setKeepIds((value.review?.snapshot ?? []).map(cape => cape.cape_id)); }
    }).catch(e => { if (active) { setOwnedError(true); setError(e instanceof Error ? e.message : "Capes konnten nicht geladen werden."); } });
    return () => { active = false; };
  }, [uuid, refresh]);
  async function run(action: () => Promise<void>, message: string) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); setNotice(message); setOwned(null); setOwnedError(false); setKeepIds([]); setConfirmReview(false); setRefresh(value => value + 1); }
    catch (e) { setError(e instanceof Error ? e.message : "Die Anfrage ist fehlgeschlagen. Bitte versuche es erneut."); }
    finally { setBusy(false); }
  }
  const candidates = new Set(owned?.review?.snapshot.map(cape => cape.cape_id) ?? []);
  return <div className="space-y-10">
    <p className="text-zinc-400">Verknüpfe deine Minecraft-Accounts, lade Capes hoch und prüfe bisherige Uploads. Häkchen bestätigen die Identität beim Upload oder bei der Übernahme, keine Urheberschaft am Motiv.</p>
    <div role="alert" className="text-red-400 whitespace-pre-wrap">{error}</div><p role="status" className="text-green-400">{notice}</p>
    <section className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-4">
      <h2 className="text-xl font-bold">Minecraft-Accounts</h2>
      {account.links.length > 0 ? <label className="block">Aktiver Account<select value={uuid} disabled={busy} onChange={e => { setUuid(e.target.value); setOwned(null); setOwnedError(false); setKeepIds([]); setConfirmReview(false); setError(""); }} className="block bg-zinc-800 p-3 rounded mt-2 w-full">{account.links.map(link => <option key={link.minecraft_uuid} value={link.minecraft_uuid}>{link.minecraft_name} ({link.minecraft_uuid})</option>)}</select></label> : <p>Noch kein Minecraft-Account verknüpft.</p>}
      <button className={buttonClass} disabled={busy || !account.mcid_enabled} onClick={() => run(async () => { const result = actionValue(await startMinecraftLink()); window.location.assign(result.url); }, "Weiter zu MC-ID…")}>Mit MC-ID verknüpfen</button>
      {!account.mcid_enabled && <p className="text-zinc-400">Die MC-ID-Verknüpfung ist noch nicht freigeschaltet. Bitte versuche es später erneut.</p>}
    </section>
    {uuid && <section className="bg-zinc-900 border border-white/10 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Cape hochladen</h2>
      <p className="text-zinc-400 mb-4">Ein erfolgreicher Upload pro Minecraft-Account und UTC-Tag. Website-Uploads erhalten ein blaues Häkchen.</p>
      <form className="space-y-4" onSubmit={event => {
        event.preventDefault(); if (!file) return;
        const form = event.currentTarget;
        const data = new FormData(); data.set("minecraft_uuid", uuid); data.set("cape_name", capeName); data.set("cape", file);
        void run(async () => { actionValue(await uploadWebsiteCape(data)); setFile(null); setPreview(""); setCapeName(""); form.reset(); }, "Dein Cape wurde hochgeladen und bestätigt.");
      }}>
        <label className="block">Cape-Name<input required maxLength={100} value={capeName} onChange={event => setCapeName(event.target.value)} className="block bg-zinc-800 rounded p-3 mt-2 w-full" /></label>
        <label className="block">PNG-Datei<input type="file" accept="image/png,.png" disabled={busy} className="block mt-2" onChange={event => {
          const next = event.target.files?.[0] ?? null; setPreview("");
          if (next && (next.size > 3 * 1024 * 1024 || !next.name.toLowerCase().endsWith(".png"))) { setError("Bitte wähle eine PNG-Datei mit maximal 3 MB."); setFile(null); return; }
          setError(""); setFile(next);
        }} /></label>
        {preview && <img src={preview} alt="Vorschau des ausgewählten Cape-Bilds" className="w-64 max-w-full bg-zinc-800 rounded [image-rendering:pixelated]" />}
        <button className={buttonClass} disabled={busy || !file}>Cape hochladen</button>
      </form>
      <Link href="/cookiecapes/editor" className="block mt-4 text-orange-400 underline">Cape im Editor gestalten</Link>
    </section>}
    {uuid && !owned && !ownedError && <p role="status">Capes werden geladen…</p>}
    {uuid && ownedError && <div className="border border-red-400/30 rounded-xl p-6 space-y-4"><p>Deine Capes konnten nicht geladen werden.</p><button disabled={busy} className={buttonClass} onClick={() => { setError(""); setOwnedError(false); setRefresh(value => value + 1); }}>Erneut laden</button></div>}
    {owned && <section className="space-y-4">
      <h2 className="text-xl font-bold">Deine Capes</h2>
      {candidates.size > 0 && <div className="border border-blue-400/30 bg-blue-500/5 rounded-xl p-6 space-y-4">
        <h3 className="font-bold">Bisherige Uploads prüfen</h3>
        <p>Wähle die Capes aus, die du übernehmen möchtest. Nicht ausgewählte Capes werden erst nach deiner Bestätigung verborgen und nach 30 Tagen dauerhaft gelöscht. Bis dahin kannst du sie hier wiederherstellen.</p>
        <p>{keepIds.length} behalten · {candidates.size - keepIds.length} entfernen</p>
        <button disabled={busy} onClick={() => setConfirmReview(true)} className={buttonClass}>Auswahl prüfen</button>
        {confirmReview && <div role="alertdialog" aria-label="Cape-Auswahl bestätigen" className="border border-orange-500 rounded p-4 space-y-4">
          <p>Verbindlich bestätigen: {keepIds.length} Capes übernehmen und {candidates.size - keepIds.length} Capes verbergen?</p>
          <button disabled={busy} className={buttonClass} onClick={() => run(async () => { actionValue(await reviewLegacyCapes(owned.review!.id, keepIds)); setConfirmReview(false); }, "Deine Auswahl wurde gespeichert. Verborgene Capes sind 30 Tage wiederherstellbar.")}>Auswahl bestätigen</button>
          <button disabled={busy} className="ml-4 underline" onClick={() => setConfirmReview(false)}>Abbrechen</button>
        </div>}
      </div>}
      {!owned.capes.length && <p className="text-zinc-400">Für diesen Account gibt es noch keine Capes.</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{owned.capes.map(cape => <article key={cape.cape_id} className="bg-zinc-900 border border-white/10 rounded-xl p-4 space-y-3">
        <img src={`/cookiecapes/account/images/${cape.cape_id}?v=${refresh}`} alt={`Cape ${cape.cape_name}`} className="w-full h-28 object-contain [image-rendering:pixelated]" />
        <h3 className="font-bold">{cape.cape_name} <VerificationBadge verification={cape.verification} /></h3>
        <p className="text-zinc-500 text-sm">#{cape.cape_id}</p>
        {candidates.has(cape.cape_id) && <label className="block"><input type="checkbox" disabled={busy || confirmReview} checked={keepIds.includes(cape.cape_id)} onChange={event => setKeepIds(event.target.checked ? [...keepIds, cape.cape_id] : keepIds.filter(id => id !== cape.cape_id))} /> Behalten und blau bestätigen</label>}
        {cape.hidden_at ? <><p className="text-orange-400 text-sm">Verborgen. Löschung: {cape.delete_after ? new Date(cape.delete_after).toLocaleString("de-DE") : "ausstehend"}</p><button disabled={busy} onClick={() => run(async () => { actionValue(await claimCape(cape.cape_id, true)); }, "Cape wiederhergestellt und bestätigt.")} className="text-blue-400 underline">Wiederherstellen</button></> : !candidates.has(cape.cape_id) && cape.verification !== "website" ? <button disabled={busy} onClick={() => run(async () => { actionValue(await claimCape(cape.cape_id)); }, "Cape übernommen und blau bestätigt.")} className="text-blue-400 underline">Übernehmen und blau bestätigen</button> : null}
      </article>)}</div>
    </section>}
  </div>;
}
