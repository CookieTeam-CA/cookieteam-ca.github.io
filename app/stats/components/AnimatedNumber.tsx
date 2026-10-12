"use client";

import { useRef, useSyncExternalStore } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { SlotText } from "slot-text/react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export default function AnimatedNumber({ value }: { value: string | number }) {
  const text = String(value);
  const element = useRef<HTMLSpanElement>(null);
  const inView = useInView(element, { once: true, amount: 0.5 });
  const reducedMotion = useReducedMotion();
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  // Keep meaningful numbers in server HTML and render statically for reduced motion.
  if (!hydrated || reducedMotion) return <span ref={element}>{text}</span>;
  return <span ref={element} className="stats-animated-number"><span className="sr-only">{text}</span><SlotText aria-hidden="true" text={inView ? text : text.replace(/\d/g, "0")} options={{ duration: 550, stagger: 28, bounce: 0.1, direction: "up", skipUnchanged: true }} /></span>;
}
