"use client";

import { useTranslations } from "@/app/cookiecapes/i18n/client";
import { Button } from "@/components/ui/button";
import { useEffect, useEffectEvent, useState } from "react";
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
  const { t, locale, plural, number } = useTranslations();
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
  const reportLoadError = useEffectEvent((error: unknown) => {
    setOwnedError(true);
    toast.add({ title: error instanceof Error ? error.message : t("Capes could not be loaded."), type: "error" });
  });

  useEffect(() => {
    let active = true;
    if (uuid) loadOwnedCapes(uuid).then(data => {
      if (!active) return;
      const value = actionValue(data);
      setOwned(value);
      setKeepIds((value.review?.snapshot ?? []).map(cape => cape.cape_id));
    }).catch(error => {
      if (!active) return;
      reportLoadError(error);
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
      toast.add({ title: error instanceof Error ? error.message : t("The request failed. Please try again."), type: "error" });
    } finally {
      setBusy(false);
    }
  }

  const candidates = new Set(owned?.review?.snapshot.map(cape => cape.cape_id) ?? []);
  return <div className="space-y-10">
    <section aria-labelledby="minecraft-accounts-title" className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60">
      <div className="grid lg:grid-cols-[1fr_1.3fr]">
        <div className="border-b border-white/10 bg-linear-to-br from-orange-500/10 to-transparent p-6 sm:p-8 lg:border-r lg:border-b-0">
          <h2 id="minecraft-accounts-title" className="font-nexa text-2xl sm:text-3xl">{t("Minecraft accounts")}</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">{t("Your players, your collection. Connect your Minecraft accounts with MC-ID and manage each player's capes.")}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-zinc-300">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{number(account.links.length)} {plural(account.links.length, "account linked", "accounts linked")}</span>
            {selectedAccount && <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-orange-300">{t("Active:")} {selectedAccount.minecraft_name}</span>}
          </div>
        </div>
        <div className="space-y-5 p-6 sm:p-8">
          {account.links.length > 0 ? <MinecraftAccountSelect links={account.links} value={uuid} disabled={controlsDisabled} onChange={nextUuid => { setUuid(nextUuid); reloadCapes(); }} /> : <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm leading-relaxed text-zinc-400">{t("No Minecraft account linked yet. Connect your first account to upload capes.")}</div>}
          <MCIDButton disabled={controlsDisabled || !account.mcid_enabled} onClick={() => run(async () => { const result = actionValue(await startMinecraftLink()); window.location.assign(result.url); }, t("Continue to MC-ID…"))}>{t("Link with MC-ID")}</MCIDButton>
          {!account.mcid_enabled && <p className="text-xs leading-relaxed text-zinc-500">{t("MC-ID linking is not enabled yet. Please try again later.")}</p>}
        </div>
      </div>
    </section>

    <SetupWizard account={account} uuid={uuid} disabled={busy} onUploaded={reloadCapes} onBusyChange={setUploadBusy} />

    {uuid && <section aria-labelledby="owned-capes-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="owned-capes-title" className="font-nexa text-3xl">{t("Your capes")}</h2>
          <p className="mt-2 text-sm text-zinc-400">{t("Manage all your capes here.")}</p>
        </div>
        {owned && <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400">{owned.capes.length} {owned.capes.length === 1 ? "Cape" : "Capes"}</span>}
      </div>
      {!owned && !ownedError && <div role="status" className="rounded-2xl border border-white/10 bg-zinc-900/40 p-8 text-center text-zinc-400">{t("Loading capes…")}</div>}
      {ownedError && <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 text-center"><Button size="lg" disabled={controlsDisabled} variant="outline" onClick={reloadCapes}>{t("Reload")}</Button></div>}
      {owned && <>
        {candidates.size > 0 && <div className="space-y-4 rounded-2xl border border-blue-400/20 bg-blue-500/5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold">{t("Review previous uploads")}</h3><span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-300">{keepIds.length} {t("to keep ·")} {candidates.size - keepIds.length} {t("to remove")}</span></div>
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-400">{t("Select the capes you want to keep. Unselected capes are hidden only after your confirmation and permanently deleted after 30 days. You can restore them here until then.")}</p>
          {!confirmReview && <Button size="lg" disabled={controlsDisabled} onClick={() => setConfirmReview(true)} variant="outline">{t("Review selection")}</Button>}
          {confirmReview && <div role="alertdialog" aria-labelledby="confirm-review-title" aria-describedby="confirm-review-description" className="space-y-4 rounded-xl border border-orange-400/40 bg-black/30 p-5">
            <h4 id="confirm-review-title" className="font-bold">{t("Confirm cape selection")}</h4>
            <p id="confirm-review-description" className="text-sm leading-relaxed text-zinc-300">{t("Confirm:")} {keepIds.length} {t("capes to keep and")} {candidates.size - keepIds.length} {t("capes to hide?")}</p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" disabled={controlsDisabled} onClick={() => run(async () => { actionValue(await reviewLegacyCapes(owned.review!.id, keepIds)); }, t("Your selection was saved. Hidden capes can be restored for 30 days."))}>{t("Confirm selection")}</Button>
              <Button size="lg" autoFocus disabled={controlsDisabled} variant="outline" onClick={() => setConfirmReview(false)}>{t("Cancel")}</Button>
            </div>
          </div>}
        </div>}
        {!owned.capes.length && <div className="rounded-2xl border border-dashed border-white/15 py-14 text-center"><h3 className="text-lg font-bold">{t("Room for your first cape")}</h3><p className="mt-2 text-sm text-zinc-400">{t("This account has no capes yet. Start with the upload above.")}</p></div>}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{owned.capes.map(cape => <article key={cape.cape_id} className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
          <div className="relative h-72 bg-linear-to-b from-white/5 to-transparent" role="group" aria-label={t("3D preview of {name}", { name: cape.cape_name })}>
            <CapeViewer capeUrl={`/cookiecapes/account/images/${cape.cape_id}?v=${refresh}`} minecraftName={selectedAccount?.minecraft_name} />
            <span className="pointer-events-none absolute top-4 left-4 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-zinc-400">#{cape.cape_id}</span>
            {cape.hidden_at && <span className="pointer-events-none absolute top-4 right-4 rounded-lg border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300">{t("Hidden")}</span>}
          </div>
          <div className="space-y-4 border-t border-white/5 p-5">
            <h3 className="flex items-center gap-2 font-bold"><span className="truncate">{cape.cape_name}</span><VerificationBadge verification={cape.verification} /></h3>
            {candidates.has(cape.cape_id) && <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-blue-400/20 bg-blue-500/5 p-3 text-sm text-blue-200"><input type="checkbox" className="h-4 w-4 accent-blue-500" disabled={controlsDisabled || confirmReview} checked={keepIds.includes(cape.cape_id)} onChange={event => setKeepIds(event.target.checked ? [...keepIds, cape.cape_id] : keepIds.filter(id => id !== cape.cape_id))} /> {t("Keep and verify with a blue badge")}</label>}
            {cape.hidden_at ? <>
              <p className="text-xs leading-relaxed text-orange-300/80">{t("Hidden. Deletion:")} {cape.delete_after ? new Date(cape.delete_after).toLocaleString(locale) : t("pending")}</p>
              <Button size="lg" disabled={controlsDisabled} onClick={() => run(async () => { actionValue(await claimCape(cape.cape_id, true)); }, t("Cape restored and verified."))} variant="outline" className="w-full">{t("Restore")}</Button>
            </> : !candidates.has(cape.cape_id) && cape.verification !== "website" ? <Button size="lg" disabled={controlsDisabled} onClick={() => run(async () => { actionValue(await claimCape(cape.cape_id)); }, t("Cape claimed and verified with a blue badge."))} variant="outline" className="w-full">{t("Claim and verify with a blue badge")}</Button> : null}
          </div>
        </article>)}</div>
        <p className="text-xs leading-relaxed text-zinc-500">{t("Badges verify identity at upload or claim time, not ownership of the design's copyright.")}</p>
      </>}
    </section>}
  </div>;
}
