"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "radix-ui";
import { Check, Copy } from "lucide-react";
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/toast";
import { loadAccount, redeemMinecraftServerCode } from "@/app/actions/account-actions";
import { actionValue, type AccountInfo } from "../lib/account-types";
import { formatMinecraftServerCode, normalizeMinecraftServerCode } from "../lib/minecraft-server-code";
import { useTranslations } from "../i18n/client";

export default function MinecraftServerLink({ account, disabled, onLinked }: {
  account: AccountInfo; disabled?: boolean; onLinked: (account: AccountInfo, uuid: string) => void;
}) {
  const { t } = useTranslations();
  const id = useId();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [linkedUuid, setLinkedUuid] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 3000);
    return () => window.clearTimeout(timer);
  }, [copied]);
  if (!account.server_link_enabled || !account.server_link_address) return <p className="text-sm text-zinc-400">{t("Server linking is currently unavailable. Use MC-ID or try again later.")}</p>;

  async function submit(completedCode = code) {
    if (disabled || inFlight.current) return;
    inFlight.current = true;
    setBusy(true); setError("");
    let redeemed = linkedUuid;
    try {
      if (!redeemed) {
        const result = actionValue(await redeemMinecraftServerCode(completedCode));
        redeemed = result.linked[0];
        setLinkedUuid(redeemed);
        setCode("");
      }
      const refreshed = await loadAccount();
      onLinked(refreshed, redeemed);
      setLinkedUuid(null);
      setOpen(false);
      toast.add({ title: t("Minecraft account linked."), type: "success" });
    } catch (cause) {
      const message = redeemed ? t("Account linked. Reload the linked accounts to continue.") : cause instanceof Error ? cause.message : t("The request failed. Please try again.");
      setError(message);
      toast.add({ title: message, type: "error" });
    } finally { setBusy(false); inFlight.current = false; }
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(account.server_link_address!);
      setCopied(true);
      toast.add({ title: t("Server address copied."), type: "success" });
    } catch {
      setCopied(false);
      toast.add({ title: t("Could not copy. Select and copy the server address manually."), type: "error" });
    }
  }

  return <Dialog.Root open={open} onOpenChange={next => { if (!busy) { if (next) setStep(linkedUuid ? 2 : 1); setOpen(next); } }}>
    <Dialog.Trigger asChild><Button size="lg" className="min-w-0 flex-1 px-3 text-sm font-bold" disabled={disabled}>{t("Link through Minecraft")}</Button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
      <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-5 text-white sm:p-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <Dialog.Title className="font-nexa text-2xl">{t("Link through Minecraft")}</Dialog.Title>
        <Dialog.Close asChild><Button variant="outline" disabled={busy}>{t("Close")}</Button></Dialog.Close>
      </div>
      {step === 1 ? <div className="space-y-4">
        <Dialog.Description className="text-sm leading-relaxed text-zinc-400">{t("Join this server in Minecraft Java Edition with the account you want to link. You will receive a code in-game. Then continue to enter it here.")}</Dialog.Description>
        <InputGroup>
          <InputGroupInput aria-label={t("Server address")} value={account.server_link_address} readOnly onFocus={event => event.target.select()} className="font-mono text-orange-300" />
          <InputGroupAddon>
            <InputGroupButton aria-label={copied ? t("Server address copied.") : t("Copy address")} title={copied ? t("Server address copied.") : t("Copy address")} onClick={() => void copyAddress()}>
              <span data-copied={copied} className="group/copy relative size-4" aria-hidden="true">
                <Copy className="absolute inset-0 transition-[opacity,transform] duration-400 ease-in-out group-data-[copied=true]/copy:scale-50 group-data-[copied=true]/copy:opacity-0 motion-reduce:transition-none" />
                <Check className="absolute inset-0 scale-50 text-orange-300 opacity-0 transition-[opacity,transform] duration-400 ease-in-out group-data-[copied=true]/copy:scale-100 group-data-[copied=true]/copy:opacity-100 motion-reduce:transition-none" />
              </span>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <div className="flex justify-end"><Button size="lg" onClick={() => setStep(2)}>{t("Next")}</Button></div>
      </div> : <form className="space-y-4" onSubmit={event => { event.preventDefault(); void submit(); }} aria-busy={busy}>
    <Dialog.Description id={`${id}-help`} className="text-sm leading-relaxed text-zinc-400">{t("Enter the code shown in Minecraft. It expires after 10 minutes. Joining the server again replaces your previous code.")}</Dialog.Description>
    {!linkedUuid && <div className="space-y-2">
      <label htmlFor={`${id}-code`} className="block text-sm">{t("Minecraft server code")}</label>
      <InputOTP onComplete={value => { if (normalizeMinecraftServerCode(value)) void submit(value); }} autoFocus id={`${id}-code`} value={code} onChange={value => { setCode(formatMinecraftServerCode(value)); setError(""); }} maxLength={12} pattern="^[0-9A-Za-z]*$" inputMode="text" pasteTransformer={formatMinecraftServerCode} required autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false} disabled={disabled || busy} aria-describedby={`${id}-help`} aria-invalid={!!error}>
        {[0, 1, 2].map(group => <Fragment key={group}>
          {group > 0 && <InputOTPSeparator />}
          <InputOTPGroup>
          {[0, 1, 2, 3].map(slot => <InputOTPSlot key={slot} index={group * 4 + slot} aria-invalid={!!error} />)}
          </InputOTPGroup>
        </Fragment>)}
      </InputOTP>
    </div>}
    <div className="flex flex-wrap gap-3">
      {!linkedUuid && <Button size="lg" type="button" variant="outline" disabled={busy} onClick={() => setStep(1)}>{t("Back")}</Button>}
      <Button className="ml-auto" size="lg" type="submit" disabled={disabled || busy || (!linkedUuid && !normalizeMinecraftServerCode(code))}>{busy ? t("Processing") : linkedUuid ? t("Reload linked accounts") : t("Link Minecraft account")}</Button>
    </div>
  </form>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
