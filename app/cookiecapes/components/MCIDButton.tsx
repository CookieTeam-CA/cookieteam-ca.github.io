import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { ButtonHTMLAttributes } from "react";

export default function MCIDButton({ children = "Mit MC-ID verknüpfen", className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button size="lg" type={type} {...props} className={`group gap-3 border border-emerald-300/15 bg-emerald-800 font-bold text-emerald-50 hover:bg-emerald-700 focus-visible:ring-emerald-400 ${className}`}>
    <Image src="/mc-id.svg" alt="" width={24} height={24} className="size-6 shrink-0" />
    {children}
  </Button>;
}
