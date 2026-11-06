"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSyncExternalStore, type ComponentProps } from "react";
import { galleryReturn } from "../lib/gallery-return";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string; returnTo?: string };
const key = (path: string) => `cookiecapes:return:${path}`;
const subscribe = () => () => {};

export default function GalleryLink({ href, returnTo, ...props }: Props) {
  const router = useRouter();
  // Keep the URL fallback for disabled storage, JavaScript, and opening a new tab.
  const fallback = returnTo ? `${href}?returnTo=${encodeURIComponent(galleryReturn(returnTo))}` : href;
  return <Link {...props} href={fallback} onNavigate={event => {
    try {
      if (returnTo) sessionStorage.setItem(key(href), galleryReturn(returnTo));
      else sessionStorage.removeItem(key(href));
    } catch { return; }
    event.preventDefault();
    router.push(href);
  }} />;
}

export function GalleryReturnLink({ href, returnTo, ...props }: Props) {
  const pathname = usePathname();
  const stored = useSyncExternalStore(subscribe, () => {
    try { return sessionStorage.getItem(key(pathname)); } catch { return null; }
  }, () => null);
  return <Link {...props} href={returnTo ? galleryReturn(returnTo) : stored ? galleryReturn(stored) : href} />;
}
