"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export default function GallerySearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), [params]);

  function search() {
    clearTimeout(timer.current);
    const next = new URLSearchParams(params);
    const value = input.current?.value ?? "";
    if (value) next.set("q", value); else next.delete("q");
    next.set("page", "1");
    if (next.toString() !== params.toString()) router.push(`?${next}`);
  }

  return <form onSubmit={event => { event.preventDefault(); search(); }} className="flex-1 relative">
    <input key={params.toString()} ref={input} type="text" aria-label={placeholder} placeholder={placeholder} defaultValue={params.get("q") ?? ""}
      onChange={() => { clearTimeout(timer.current); timer.current = setTimeout(search, 500); }}
      className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-orange-500 focus:outline-none transition-colors" />
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
  </form>;
}
