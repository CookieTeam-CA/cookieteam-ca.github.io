"use client";

import { useTranslations } from "@/app/cookiecapes/i18n/client";
import { useEffect, useRef, useState } from "react";
import { useElementActive } from "@/app/lib/visibility";
import CapeViewer from "../components/CapeViewer";
import type { Cape } from "../lib/api";

export default function AccountCapePreview({ capes }: { capes: Cape[] }) {
  const { t } = useTranslations();
  const container = useRef<HTMLDivElement>(null);
  const active = useElementActive(container);
  const [index, setIndex] = useState(0);
  const cape = capes[index] ?? capes[0];

  useEffect(() => {
    if (!active || capes.length < 2) return;
    const interval = setInterval(() => setIndex(current => (current + 1) % capes.length), 4000);
    return () => clearInterval(interval);
  }, [active, capes.length]);

  return <div ref={container} role="group" aria-label={cape ? t("3D preview of {name}", { name: cape.cape_name }) : t("Interactive Minecraft preview")} className="absolute inset-0 bottom-12">
    <CapeViewer capeUrl={cape?.cape_image_url ?? null} skinUrl={cape ? `https://minotar.net/skin/${cape.minecraft_uuid}` : undefined} animation="idle" />
  </div>;
}
