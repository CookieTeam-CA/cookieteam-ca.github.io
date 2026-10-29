"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, ToggleGroup } from "radix-ui";
import { Check, EyeOff, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { reviewLegacyCapes } from "@/app/actions/account-actions";
import { useTranslations } from "../i18n/client";
import { actionValue, type OwnedCapes } from "../lib/account-types";
import CapeViewer from "../components/CapeViewer";
import { cn } from "@/lib/utils";

export default function PreviousUploadsReview({ owned, minecraftName, disabled, onReviewed, onReload }: {
  owned: OwnedCapes;
  minecraftName?: string;
  disabled: boolean;
  onReviewed: () => void;
  onReload: () => void;
}) {
  const { t, number } = useTranslations();
  const [open, setOpen] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [keepIds, setKeepIds] = useState(() => (owned.review?.snapshot ?? []).map(cape => cape.cape_id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const candidates = new Set(owned.review?.snapshot.map(cape => cape.cape_id) ?? []);
  const capes = owned.capes.filter(cape => candidates.has(cape.cape_id));
  const kept = capes.filter(cape => keepIds.includes(cape.cape_id));
  const hidden = capes.filter(cape => !keepIds.includes(cape.cape_id));
  const incomplete = capes.length !== candidates.size;
  const locked = busy || disabled;

  useEffect(() => { titleRef.current?.focus(); }, [confirming]);

  async function save() {
    if (locked || incomplete || !owned.review) return;
    setBusy(true);
    setError("");
    try {
      actionValue(await reviewLegacyCapes(owned.review.id, keepIds));
      toast.add({ title: t("Your selection was saved. Hidden capes can be restored for 30 days."), type: "success" });
      setOpen(false);
      onReviewed();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("The request failed. Please try again."));
    } finally { setBusy(false); }
  }

  return <Dialog.Root open={open && !disabled} onOpenChange={next => {
    if (busy) return;
    setOpen(next);
    setConfirming(false);
  }}>
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-white">{t("Review previous uploads")}</h3>
        <p className="text-sm text-zinc-400">{t("{count} previous uploads are waiting for your review.", { count: number(candidates.size) })}</p>
      </div>
      <Dialog.Trigger asChild><Button size="lg" disabled={disabled} variant="outline">{t("Review previous uploads")}</Button></Dialog.Trigger>
    </div>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
      <Dialog.Content onOpenAutoFocus={event => { event.preventDefault(); titleRef.current?.focus(); }} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onInteractOutside={event => { if (busy) event.preventDefault(); }} className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 text-white shadow-2xl outline-none">
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 p-5 sm:px-8 sm:pt-8">
          <Dialog.Title ref={titleRef} tabIndex={-1} className="font-nexa text-2xl text-balance outline-none sm:text-3xl">{confirming ? t("Confirm cape selection") : t("Review previous uploads")}</Dialog.Title>
          <Dialog.Close asChild><Button type="button" variant="ghost" className="min-h-11 min-w-11 p-2" disabled={busy} aria-label={t("Review later")}><X aria-hidden="true" /></Button></Dialog.Close>
        </header>

        <div className="flex min-h flex-col gap-5 overflow-y-auto overscroll-contain px-5 pt-5 pb-5 sm:px-8 sm:pt-8 sm:pb-8">
          <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-pretty text-zinc-300">{t("Select the capes you want to keep. Unselected capes are hidden only after your confirmation and permanently deleted after 30 days. You can restore them here until then.")}</p>
          {incomplete && <p role="alert" className="text-sm text-red-300">{t("Some capes could not be loaded. Reload before confirming.")}</p>}
          {!confirming ? <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{capes.map(cape => {
              const keep = keepIds.includes(cape.cape_id);
              return <article key={cape.cape_id} className={cn("overflow-hidden rounded-2xl border bg-zinc-900/60 transition-colors motion-reduce:transition-none", keep ? "border-orange-400/40" : "border-white/10")}>
                <div className="relative h-48 bg-linear-to-b from-white/5 to-transparent" role="group" aria-label={t("3D preview of {name}", { name: cape.cape_name })}>
                  <CapeViewer capeUrl={`/cookiecapes/account/images/${cape.cape_id}?v=${cape.last_edited}`} minecraftName={minecraftName} />
                  <span className="pointer-events-none absolute top-3 left-3 rounded-md bg-zinc-950/80 px-2 py-1 text-xs text-zinc-400">#{cape.cape_id}</span>
                </div>
                <div className="flex flex-col gap-3 border-t border-white/5 p-4">
                  <h3 className="wrap-anywhere font-bold text-pretty">{cape.cape_name}</h3>
                  <ToggleGroup.Root type="single" value={keep ? "keep" : "hide"} disabled={locked} aria-label={t("Review {name}", { name: cape.cape_name })} onValueChange={value => {
                    if (!value) return;
                    setKeepIds(ids => value === "keep" ? [...ids.filter(id => id !== cape.cape_id), cape.cape_id] : ids.filter(id => id !== cape.cape_id));
                  }} className="grid grid-cols-2 gap-2">
                    <ToggleGroup.Item value="keep" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-zinc-400 outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50 data-[state=on]:border-orange-400/50 data-[state=on]:bg-orange-500/10 data-[state=on]:text-orange-300 motion-reduce:transition-none"><Check className="size-4" aria-hidden="true" />{t("Keep")}</ToggleGroup.Item>
                    <ToggleGroup.Item value="hide" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-zinc-400 outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50 data-[state=on]:border-red-400/40 data-[state=on]:bg-red-400/10 data-[state=on]:text-red-300 motion-reduce:transition-none"><EyeOff className="size-4" aria-hidden="true" />{t("Hide")}</ToggleGroup.Item>
                  </ToggleGroup.Root>
                  <p className="text-xs text-pretty text-zinc-400">{keep ? t("Keep and verify with a blue badge") : t("Hidden after confirmation. Restorable for 30 days.")}</p>
                </div>
              </article>;
            })}</div>
            <p className="text-xs leading-relaxed text-pretty text-zinc-500">{t("Badges verify identity, not ownership of the design's copyright.")}</p>
          </> : <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5"><h3 className="flex items-center gap-2 font-bold text-orange-300"><Check className="size-4" aria-hidden="true" />{t("Keep")} · {number(kept.length)}</h3><ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-300">{kept.map(cape => <li key={cape.cape_id} className="wrap-anywhere">{cape.cape_name} <span className="text-zinc-500">#{cape.cape_id}</span></li>)}</ul></section>
            <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5"><h3 className="flex items-center gap-2 font-bold text-red-300"><EyeOff className="size-4" aria-hidden="true" />{t("Hide")} · {number(hidden.length)}</h3><ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-300">{hidden.map(cape => <li key={cape.cape_id} className="wrap-anywhere">{cape.cape_name} <span className="text-zinc-500">#{cape.cape_id}</span></li>)}</ul></section>
          </div>}
          {error && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-400/30 bg-red-400/5 p-4"><p className="text-sm text-pretty text-red-300">{error}</p><Button disabled={locked} variant="outline" onClick={onReload}>{t("Reload")}</Button></div>}
          {incomplete && <Button disabled={locked} variant="outline" onClick={onReload}>{t("Reload")}</Button>}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-zinc-900 p-5 sm:px-8">
          <p className="text-sm font-semibold tabular-nums" aria-live="polite">{t("{keep} to keep · {hide} to hide", { keep: number(kept.length), hide: number(hidden.length) })}</p>
          <div className="flex w-full flex-col-reverse gap-2 min-[480px]:w-auto min-[480px]:flex-row">
            {confirming ? <Button size="lg" variant="outline" disabled={locked} onClick={() => { setConfirming(false); setError(""); }}>{t("Back to selection")}</Button> : <Dialog.Close asChild><Button size="lg" variant="outline" disabled={busy}>{t("Review later")}</Button></Dialog.Close>}
            <Button size="lg" disabled={locked || incomplete} onClick={() => { if (confirming) void save(); else setConfirming(true); }}>{busy && <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}{busy ? t("Saving…") : confirming ? t("Confirm selection") : t("Review selection")}</Button>
          </div>
        </footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
