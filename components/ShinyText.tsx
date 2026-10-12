"use client";

import { useEffect, useRef, type CSSProperties } from "react";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  color?: string;
  shineColor?: string;
  spread?: number;
  yoyo?: boolean;
  pauseOnHover?: boolean;
  direction?: "left" | "right";
  delay?: number;
}

export default function ShinyText({ text, disabled = false, speed = 2, className = "", color = "#b5b5b5", shineColor = "#ffffff", spread = 120, yoyo = false, pauseOnHover = false, direction = "left", delay = 0 }: ShinyTextProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = spanRef.current;
    if (!element || disabled || speed <= 0) return;
    const start = direction === "left" ? "150% center" : "-50% center";
    const end = direction === "left" ? "-50% center" : "150% center";
    const cycle = speed + Math.max(0, delay);
    const length = cycle * (yoyo ? 2 : 1);
    const keyframes: Keyframe[] = [
      { backgroundPosition: start, offset: 0 },
      { backgroundPosition: end, offset: speed / length },
      { backgroundPosition: end, offset: cycle / length },
      ...(yoyo ? [
        { backgroundPosition: start, offset: (cycle + speed) / length },
        { backgroundPosition: start, offset: 1 },
      ] : []),
    ];
    const animation = element.animate(keyframes, { duration: length * 1000, iterations: Infinity, easing: "linear" });
    let inView = false, hovered = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (inView && !document.hidden && !reducedMotion.matches && !(pauseOnHover && hovered)) animation.play();
      else animation.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    const enter = () => { hovered = true; sync(); };
    const leave = () => { hovered = false; sync(); };
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);
    element.addEventListener("mouseenter", enter);
    element.addEventListener("mouseleave", leave);
    sync();
    return () => {
      animation.cancel();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
      element.removeEventListener("mouseenter", enter);
      element.removeEventListener("mouseleave", leave);
    };
  }, [disabled, speed, yoyo, pauseOnHover, direction, delay]);
  const style: CSSProperties = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
    backgroundSize: "200% auto", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", backgroundPosition: "150% center",
  };
  return <span ref={spanRef} className={`inline-block ${className}`} style={style}>{text}</span>;
}
