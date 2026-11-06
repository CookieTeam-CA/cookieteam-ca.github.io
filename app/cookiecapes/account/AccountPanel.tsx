"use client";

import { useTranslations } from "@/app/cookiecapes/i18n/client";
import Link from "next/link";
import { ArrowUpRight, Check, Globe, EyeOff, ImageUp, LoaderCircle, LockKeyhole, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { editOwnedCape, claimCape, restoreOwnedCape, loadOwnedCapes, startMinecraftLink } from "@/app/actions/account-actions";
import { actionValue } from "../lib/account-types";
import type { AccountInfo, OwnedCape, OwnedCapes } from "../lib/account-types";
import CapeViewer from "../components/CapeViewer";
import MinecraftServerLink from "../components/MinecraftServerLink";
import MCIDButton from "../components/MCIDButton";
import MinecraftAccountSelect from "../components/MinecraftAccountSelect";
import SetupWizard from "../components/SetupWizard";
import { useDuplicateToast } from "../lib/duplicate-toast";
import { toast } from "@/components/ui/toast";
import VerificationBadge from "../components/VerificationBadge";
import PreviousUploadsReview from "./PreviousUploadsReview";


export default function AccountPanel({ account: initialAccount }: { account: AccountInfo }) {
  const [updatedAccount, setAccount] = useState<AccountInfo | null>(null);
  const account = updatedAccount ?? initialAccount;
  const duplicateToast = useDuplicateToast();
  const { t, locale, plural, number } = useTranslations();
  const [renaming, setRenaming] = useState<{ id: number; name: string; error: string } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [replacement, setReplacement] = useState<OwnedCape | null>(null);
  const replacementRef = useRef<HTMLDivElement>(null);
  const [uuid, setUuid] = useState(account.links[0]?.minecraft_uuid ?? "");
  const [owned, setOwned] = useState<OwnedCapes | null>(null);
  const [ownedError, setOwnedError] = useState(false);
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
    if (!replacement) return;
    replacementRef.current?.focus({ preventScroll: true });
    replacementRef.current?.scrollIntoView({ block: "start" });
  }, [replacement]);

  useEffect(() => {
    let active = true;
    if (uuid) loadOwnedCapes(uuid).then(data => {
      if (!active) return;
      const value = actionValue(data);
      setOwned(value);
    }).catch(error => {
      if (!active) return;
      reportLoadError(error);
    });
    return () => { active = false; };
  }, [uuid, refresh]);

  const quotaReset = owned?.quota?.resets_at;
  useEffect(() => {
    if (!quotaReset) return;
    const delay = new Date(quotaReset).getTime() - Date.now();
    if (!Number.isFinite(delay)) return;
    const timer = window.setTimeout(() => setRefresh(value => value + 1), Math.max(1000, delay + 1000));
    return () => window.clearTimeout(timer);
  }, [quotaReset]);

  function reloadCapes() {
    setRenaming(null);
    setDeleting(null);
    setReplacement(null);
    setOwned(null);
    setOwnedError(false);
    setRefresh(value => value + 1);
  }

  function accountLinked(nextAccount: AccountInfo, linkedUuid: string) {
    setAccount(nextAccount);
    setUuid(linkedUuid);
    reloadCapes();
  }

  function cancelRename(id: number) {
    setRenaming(null);
    document.getElementById(`rename-cape-${id}`)?.focus();
  }

  async function run(action: () => Promise<void>, message: string) {
    setBusy(true);
    try {
      await action();
      toast.add({ title: message, type: "success" });
      reloadCapes();
    } catch (error) {
      if (!duplicateToast(error)) toast.add({ title: error instanceof Error ? error.message : t("The request failed. Please try again."), type: "error" });
    } finally {
      setBusy(false);
    }
  }

  const candidates = new Set(owned?.review?.snapshot.map(cape => cape.cape_id) ?? []);
  return <div className="account-workspace flex flex-col gap-8">
    <section aria-labelledby="minecraft-accounts-title" className="account-connections overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid lg:grid-cols-[1fr_2fr]">
        <div className="border-b border-white/10 bg-black/20 p-6 sm:p-8 lg:border-r lg:border-b-0">
          <h2 id="minecraft-accounts-title" className="font-nexa text-2xl">{t("Minecraft accounts")}</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">{t("Your players, your collection. Link your Minecraft accounts and manage each player's capes.")}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-zinc-300">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{number(account.links.length)} {plural(account.links.length, "account linked", "accounts linked")}</span>
            {selectedAccount && <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-orange-300">{t("Active:")} {selectedAccount.minecraft_name}</span>}
          </div>
        </div>
        <div className="space-y-5 p-6 sm:p-8">
          {account.links.length > 0 ? <MinecraftAccountSelect links={account.links} value={uuid} disabled={controlsDisabled} onChange={nextUuid => { setUuid(nextUuid); reloadCapes(); }} /> : <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm leading-relaxed text-zinc-400">{t("No Minecraft account linked yet. Connect your first account to upload capes.")}</div>}
          <div className="flex items-center gap-2">
<MinecraftServerLink account={account} disabled={controlsDisabled} onLinked={accountLinked} />
          {account.server_link_enabled && account.server_link_address && <p className="max-w-16 shrink-0 text-center text-xs text-zinc-500">{t("or through MC-ID")}</p>}
          <MCIDButton className="min-w-0 flex-1 px-3 text-sm" disabled={controlsDisabled || !account.mcid_enabled} onClick={() => run(async () => { const result = actionValue(await startMinecraftLink()); window.location.assign(result.url); }, t("Continue to MC-ID…"))}>{t("Link with MC-ID")}</MCIDButton>
</div>
          {!account.mcid_enabled && <p className="text-xs leading-relaxed text-zinc-500">{t("MC-ID linking is not enabled yet. Please try again later.")}</p>}
        </div>
      </div>
    </section>

    <SetupWizard account={account} onAccountLinked={accountLinked} uuid={uuid} quota={owned?.quota} disabled={controlsDisabled} onUploaded={reloadCapes} onBusyChange={setUploadBusy} />

    {replacement && <div ref={replacementRef} role="region" aria-label={t("Replace cape image")} tabIndex={-1} className="scroll-mt-24"><SetupWizard key={replacement.cape_id} account={account} uuid={uuid} initialName={replacement.cape_name} initialCapeUrl={`/cookiecapes/account/images/${replacement.cape_id}?v=${refresh}`} initialAnimationManifest={replacement.animation ? `/cookiecapes/account/animation/${replacement.cape_id}/manifest.json?v=${refresh}` : undefined} quota={owned?.quota} replacementId={replacement.cape_id} disabled={controlsDisabled} onCancel={() => setReplacement(null)} onUploaded={reloadCapes} onBusyChange={setUploadBusy} /></div>}
    {uuid && <section aria-labelledby="owned-capes-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="owned-capes-title" className="font-nexa text-2xl sm:text-3xl">{t("Manage your capes here.")}</h2>
        </div>
        {owned && <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400">{owned.capes.length} {owned.capes.length === 1 ? "Cape" : "Capes"}</span>}
      </div>
      {!owned && !ownedError && <div role="status">
        <span className="sr-only">{t("Loading capes…")}</span>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-border bg-card">
            <Skeleton className="h-64 rounded-none" />
            <div className="flex flex-col gap-4 p-5"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div>
          </div>)}
        </div>
      </div>}
      {ownedError && <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 text-center"><Button size="lg" disabled={controlsDisabled} variant="outline" onClick={reloadCapes}>{t("Reload")}</Button></div>}
      {owned && <>
        {candidates.size > 0 && <PreviousUploadsReview key={`${uuid}:${[...candidates].join(",")}`} owned={owned} minecraftName={selectedAccount?.minecraft_name} disabled={controlsDisabled} onReviewed={reloadCapes} onReload={reloadCapes} />}
        {!owned.capes.length && <div className="rounded-2xl border border-dashed border-white/15 py-14 text-center"><h3 className="text-lg font-bold">{t("Room for your first cape")}</h3><p className="mt-2 text-sm text-zinc-400">{t("This account has no capes yet. Start with the upload above.")}</p></div>}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{owned.capes.map(cape => <article key={cape.cape_id} className="account-cape-card overflow-hidden rounded-2xl border border-border bg-card">
          <div className="account-cape-preview relative h-64" role="group" aria-label={t("3D preview of {name}", { name: cape.cape_name })}>
            <CapeViewer capeUrl={`/cookiecapes/account/images/${cape.cape_id}?v=${refresh}`} animationManifest={`/cookiecapes/account/animation/${cape.cape_id}/manifest.json?v=${refresh}`} minecraftName={selectedAccount?.minecraft_name} />
            <span className="pointer-events-none absolute top-4 left-4 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-zinc-400">#{cape.cape_id}</span>
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {cape.is_private && <span title={t("Private cape")} className="inline-flex size-9 items-center justify-center rounded-xl border border-orange-300/20 bg-zinc-950/85 text-orange-300 shadow-sm backdrop-blur-sm"><LockKeyhole className="size-4" aria-hidden="true" /><span className="sr-only">{t("Private cape")}</span></span>}
              {cape.hidden_at && <span title={t("Hidden")} className="inline-flex size-9 items-center justify-center rounded-xl border border-orange-400/20 bg-zinc-950/85 text-orange-300 shadow-sm backdrop-blur-sm"><EyeOff className="size-4" aria-hidden="true" /><span className="sr-only">{t("Hidden")}</span></span>}
            </div>
          </div>
          <div className="space-y-4 border-t border-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="min-w-0 font-bold"><Link href={`/cookiecapes/capes/${cape.cape_id}`} className="group inline-flex max-w-full items-center gap-2 rounded-sm outline-none transition-colors hover:text-orange-300 focus-visible:ring-2 focus-visible:ring-orange-400"><span className="truncate">{cape.cape_name}</span><ArrowUpRight className="size-4 shrink-0 text-zinc-500 transition-colors group-hover:text-orange-300" aria-hidden="true" /></Link></h3>
              <VerificationBadge verification={cape.verification} />
            </div>
            {!cape.hidden_at && <>
              <div className="account-cape-actions grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:grid-cols-1 md:grid-cols-2 border-t border-white/5 pt-4">
                <Button id={`rename-cape-${cape.cape_id}`} className="min-h-11 justify-start px-3 text-zinc-300 hover:border-orange-400/25 hover:text-zinc-300" disabled={controlsDisabled} variant="outline" onClick={() => { setDeleting(null); setRenaming({ id: cape.cape_id, name: cape.cape_name, error: "" }); }}><Pencil aria-hidden="true" />{t("Rename")}</Button>
                <Button className="min-h-11 justify-start px-3 text-zinc-300 hover:border-orange-400/25 hover:text-zinc-300" disabled={controlsDisabled} variant="outline" onClick={() => run(async () => { actionValue(await editOwnedCape(cape.cape_id, "visibility", !cape.is_private)); }, t("Cape updated."))}>{cape.is_private ? <Globe aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}{cape.is_private ? t("Make public") : t("Make private")}</Button>
                <Button className="min-h-11 justify-start px-3 text-zinc-300 hover:border-orange-400/25 hover:text-zinc-300" disabled={controlsDisabled} variant="outline" onClick={() => setReplacement(cape)}><ImageUp aria-hidden="true" />{t("Replace image")}</Button>
                <Button className="min-h-11 justify-start px-3" disabled={controlsDisabled} variant="destructive" onClick={() => { setRenaming(null); setDeleting(cape.cape_id); }}><Trash2 aria-hidden="true" />{t("Delete")}</Button>
              </div>
              {renaming?.id === cape.cape_id && <form className="account-inline-panel space-y-3 rounded-xl border border-white/15 bg-black/30 p-4" onSubmit={async event => {
                event.preventDefault();
                if (controlsDisabled || !renaming.name.trim()) return;
                setBusy(true);
                try {
                  actionValue(await editOwnedCape(cape.cape_id, "rename", renaming.name.trim()));
                  toast.add({ title: t("Cape updated."), type: "success" });
                  reloadCapes();
                } catch (error) {
                  setRenaming(current => current && ({ ...current, error: error instanceof Error ? error.message : t("The request failed. Please try again.") }));
                } finally { setBusy(false); }
              }} onKeyDown={event => { if (event.key === "Escape" && !controlsDisabled) { event.preventDefault(); cancelRename(cape.cape_id); }; }}>
                <label htmlFor={`cape-name-${cape.cape_id}`} className="block text-sm text-zinc-300">{t("Cape name")}</label>
                <input id={`cape-name-${cape.cape_id}`} autoFocus required maxLength={200} value={renaming.name} disabled={controlsDisabled} aria-invalid={!!renaming.error} aria-describedby={renaming.error ? `cape-name-error-${cape.cape_id}` : undefined} onChange={event => setRenaming({ ...renaming, name: event.target.value, error: "" })} className="min-h-11 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15 disabled:opacity-50" />
                {renaming.error && <p id={`cape-name-error-${cape.cape_id}`} role="alert" className="text-sm text-red-300">{renaming.error}</p>}
                <div className="flex flex-col gap-2 min-[400px]:flex-row sm:flex-col md:flex-row"><Button className="min-h-11 flex-1" type="submit" disabled={controlsDisabled || !renaming.name.trim()}>{busy ? <LoaderCircle data-icon="inline-start" className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Check aria-hidden="true" />}{busy ? t("Saving…") : t("Save")}</Button><Button className="min-h-11 flex-1 text-zinc-300 hover:text-zinc-300" type="button" variant="outline" disabled={controlsDisabled} onClick={() => cancelRename(cape.cape_id)}><X aria-hidden="true" />{t("Cancel")}</Button></div>
              </form>}
              {deleting === cape.cape_id && <div role="alert" className="space-y-3 rounded-xl border border-red-400/20 bg-red-500/5 p-4">
                <p className="text-sm leading-relaxed text-zinc-300">{t("Delete this cape? It will be unequipped immediately. You can restore it here for 30 days.")}</p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row sm:flex-col md:flex-row"><Button className="min-h-11 flex-1" variant="destructive" disabled={controlsDisabled} onClick={() => run(async () => { actionValue(await editOwnedCape(cape.cape_id, "delete")); }, t("Cape deleted."))}><Trash2 aria-hidden="true" />{t("Delete")}</Button><Button autoFocus className="min-h-11 flex-1 text-zinc-300 hover:text-zinc-300" variant="outline" disabled={controlsDisabled} onClick={() => setDeleting(null)}>{t("Cancel")}</Button></div>
              </div>}
            </>}
            {cape.hidden_at ? <>
              <p className="text-xs leading-relaxed text-orange-300/80">{t("Hidden. Deletion:")} {cape.delete_after ? new Date(cape.delete_after).toLocaleString(locale) : t("pending")}</p>
              <Button size="lg" disabled={controlsDisabled} onClick={() => run(async () => { actionValue(await restoreOwnedCape(cape.cape_id)); }, t("Cape restored."))} variant="outline" className="w-full">{t("Restore")}</Button>
            </> : !candidates.has(cape.cape_id) && cape.verification !== "website" ? <Button size="lg" disabled={controlsDisabled} onClick={() => run(async () => { actionValue(await claimCape(cape.cape_id)); }, t("Cape claimed and verified with a blue badge."))} variant="outline" className="w-full">{t("Verify with a blue badge")}</Button> : null}
          </div>
        </article>)}</div>
      </>}
    </section>}
  </div>;
}
