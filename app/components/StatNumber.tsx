"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

export default function StatNumber({ value, prefix = "", suffix = "", decimals = 0, locale = "de-DE" }: { value: number; prefix?: string; suffix?: string; decimals?: number; locale?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reducedMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!inView || reducedMotion) return;
    const animation = animate(0, value, { duration: 3, ease: "easeInOut", onUpdate: setCurrent });
    return () => animation.stop();
  }, [inView, reducedMotion, value]);
  const formatted = (reducedMotion ? value : current).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span ref={ref} aria-label={`${prefix}${value.toLocaleString(locale)} ${suffix}`}><span aria-hidden="true">{prefix}{formatted}{suffix}</span></span>;
}
