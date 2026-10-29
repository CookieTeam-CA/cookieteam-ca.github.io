"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { Popover } from "radix-ui";
import { Button } from "@/components/ui/button";
import { useTranslations } from "../i18n/client";
import type { SubmissionQuota } from "../lib/account-types";

export default function SubmissionQuotaBar({ quota }: { quota: SubmissionQuota }) {
  const { t, locale, number } = useTranslations();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function leave() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  const remainingText = t("{remaining} / {limit} remaining", { remaining: number(quota.remaining), limit: number(quota.limit) });
  return <div className="w-full shrink-0 rounded-xl border border-white/10 bg-black/20 px-4 py-3 sm:w-72">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0"><span className="text-xs font-medium text-zinc-400">{t("Daily allowance")}</span><p aria-live="polite" className="mt-1 text-sm font-semibold tabular-nums text-zinc-100">{remainingText}</p></div>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Button type="button" variant="ghost" className="size-11 rounded-full p-0 text-zinc-400 hover:bg-transparent hover:text-zinc-400 aria-expanded:bg-transparent aria-expanded:text-zinc-400 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-orange-400/50" aria-label={t("About the daily allowance")} onPointerEnter={event => { if (event.pointerType === "mouse") show(); }} onPointerLeave={leave} onFocus={show} onClick={event => { event.preventDefault(); show(); }}><Info aria-hidden="true" /></Button>
        </Popover.Trigger>
        <Popover.Portal>
          {/* Restoring focus on close would reopen this hover popover through onFocus. */}
          <Popover.Content aria-label={t("About the daily allowance")} align="end" sideOffset={8} onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()} onPointerEnter={show} onPointerLeave={leave} className="z-50 w-80 max-w-[calc(100vw-2rem)] space-y-3 rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm leading-relaxed text-zinc-300 shadow-xl outline-none">
            <p className="font-medium text-white">{t("Three uploads or replacements per account per UTC day.")}</p>
            {quota.pending > 0 && <p>{t("{pending} submissions in progress; their slots are temporarily reserved.", { pending: number(quota.pending) })}</p>}
            <p className="text-zinc-400">{t("Resets at {time} (00:00 UTC). Renaming, visibility changes, deleting and restoring are free.", { time: new Date(quota.resets_at).toLocaleString(locale) })}</p>
            <Popover.Arrow className="fill-zinc-950" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
    <div role="meter" aria-label={t("Daily allowance")} aria-valuemin={0} aria-valuemax={quota.limit} aria-valuenow={quota.remaining} aria-valuetext={remainingText} className="mt-3 flex gap-1.5">
      {Array.from({ length: quota.limit }, (_, index) => <span key={index} aria-hidden="true" className={`h-1.5 flex-1 rounded-full ${index < quota.remaining ? "bg-orange-400" : index < quota.remaining + quota.pending ? "border border-dashed border-orange-400/50 bg-orange-400/10" : "bg-white/10"}`} />)}
    </div>
  </div>;
}
