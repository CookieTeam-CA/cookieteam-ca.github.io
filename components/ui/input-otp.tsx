"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { cn } from "@/lib/utils";

export function InputOTP({ className, containerClassName, ...props }: React.ComponentProps<typeof OTPInput>) {
  return <OTPInput data-slot="input-otp" containerClassName={cn("flex w-full min-w-0 items-center gap-1.5 has-disabled:opacity-50 sm:gap-2", containerClassName)} className={cn("disabled:cursor-not-allowed", className)} {...props} />;
}

export function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="input-otp-group" className={cn("flex min-w-0 flex-1 items-center gap-0.5 sm:gap-1", className)} {...props} />;
}

export function InputOTPSlot({ index, className, ...props }: React.ComponentProps<"div"> & { index: number }) {
  const { char, hasFakeCaret, isActive } = React.useContext(OTPInputContext).slots[index];
  return <div data-slot="input-otp-slot" data-active={isActive} className={cn("relative flex h-11 min-w-0 flex-1 items-center justify-center rounded-md border border-white/15 bg-zinc-950 font-mono text-base text-white data-[active=true]:border-orange-400 data-[active=true]:ring-2 data-[active=true]:ring-orange-400/20 aria-invalid:border-red-400", className)} {...props}>
    {char}
    {hasFakeCaret && <span className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="h-4 w-px bg-white" /></span>}
  </div>;
}

export function InputOTPSeparator() {
  return <span data-slot="input-otp-separator" aria-hidden="true" className="text-zinc-500">-</span>;
}
