"use client";

import { useTranslations } from "@/app/cookiecapes/i18n/client";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SlotText } from "slot-text/react";
import "slot-text/style.css";
import { useElementActive, useReducedMotion } from "@/app/lib/visibility";

export default function CapeHero() {
  const { t } = useTranslations();
  const heroRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const active = useElementActive(heroRef);
  const reducedMotion = useReducedMotion();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const phrases = [t("Your skin."), t("Your cape."), "CookieCapes"];
  const index = reducedMotion ? 2 : phraseIndex;

  useLayoutEffect(() => {
    const text = textRef.current;
    if (!text) return;
    // Keep outgoing glyphs in their original color while incoming glyphs inherit the new one.
    text.querySelectorAll<HTMLElement>(".char-face").forEach(face => {
      face.style.color = getComputedStyle(face).color;
    });
    text.dataset.brand = String(index === 2);
  }, [index]);

  useEffect(() => {
    if (!active || reducedMotion) return;
    const interval = window.setInterval(() => setPhraseIndex(current => (current + 1) % 3), 2400);
    return () => window.clearInterval(interval);
  }, [active, reducedMotion]);

  return (
    <section ref={heroRef} className="cape-hero">
      <div className="cape-hero-copy">
        <h1 className="cape-hero-title">
          <span className="sr-only">{t("Your skin. Your cape.")} CookieCapes</span>
          <SlotText ref={textRef} aria-hidden="true" text={phrases[index]} options={{ skipUnchanged: false, duration: reducedMotion ? 0 : 800, bounce: 0 }} />
        </h1>
        <p className="hero-description">{t("Discover community capes or design your own.")}</p>
        <div className="hero-actions">
          <Button asChild size="lg"><a href="#setup-wizard" onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const wizard = document.getElementById("setup-wizard");
            if (!wizard) return;
            event.preventDefault();
            wizard.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
          }}>{t("Upload a cape")}<ArrowDown data-icon="inline-end" /></a></Button>
          <Button asChild variant="outline" size="lg"><Link href="/cookiecapes/capes">{t("Browse capes")}</Link></Button>
        </div>
      </div>
    </section>
  );
}
