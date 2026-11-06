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

  return <form onSubmit={event => { event.preventDefault(); search(); }} className="relative min-w-0 flex-1">
    <input key={params.toString()} ref={input} type="text" name="q" autoComplete="off" aria-label={placeholder} placeholder={placeholder} defaultValue={params.get("q") ?? ""}
      onChange={() => { clearTimeout(timer.current); timer.current = setTimeout(search, 500); }}
      className="gallery-control w-full pl-10 pr-4" />
    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
  </form>;
}
