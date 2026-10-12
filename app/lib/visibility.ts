"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

const subscribe = (notify: () => void) => {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
};
const visible = () => document.visibilityState !== "hidden";
const serverVisible = () => true;

export function usePageVisible() {
  return useSyncExternalStore(subscribe, visible, serverVisible);
}

export function useElementActive(ref: RefObject<HTMLElement | null>, rootMargin = "0px") {
  const pageVisible = usePageVisible();
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return pageVisible && inView;
}
