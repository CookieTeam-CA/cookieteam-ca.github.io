"use client";

import { useTranslations } from "@/app/cookiecapes/i18n/client";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import type { Cape } from "../lib/api";
import { capePreviewUrl } from "../lib/preview-url";
import StaticPreview from "./StaticPreview";

export default function CapeHero({ cape }: { cape?: Cape }) {
  const { t } = useTranslations();

  return (
    <section className="cape-hero">
      <div className="cape-hero-copy">
        <p className="section-kicker">Minecraft / CookieCapes</p>
        <h1>{t("Your skin. Your cape.")}</h1>
        <p className="hero-description">{t("Discover community capes and design your own in the editor.")} {t("Upload capes through your Minecraft account.")}</p>
        <div className="hero-actions">
          <Button asChild size="lg"><a href="#setup-wizard">{t("Upload a cape")}<ArrowDown data-icon="inline-end" /></a></Button>
          <Button asChild variant="outline" size="lg"><Link href="/cookiecapes/capes">{t("Browse capes")}<ArrowUpRight data-icon="inline-end" /></Link></Button>
        </div>
        <ul className="cape-benefits">
          {[t("Fast"), t("Efficient"), t("Free")].map(tag => <li key={tag}><Check size={15} aria-hidden="true" />{tag}</li>)}
        </ul>
      </div>
      {cape && <Link href={`/cookiecapes/capes/${cape.cape_id}`} className="cape-hero-art" aria-label={cape.cape_name}>
        <div className="cape-art-heading"><span>Community / Capes</span><ArrowUpRight size={20} aria-hidden="true" /></div>
        <div className="cape-art-preview"><StaticPreview src={capePreviewUrl(cape.cape_id, cape.last_edited)} alt={`${cape.cape_name}, cape by ${cape.minecraft_name}`} viewerFallback={{ capeUrl: cape.cape_image_url, minecraftName: cape.minecraft_uuid }} /></div>
        <div className="cape-art-caption"><div><strong>{cape.cape_name}</strong><span>{cape.minecraft_name}</span></div><span className="font-mono text-xs">#{cape.cape_id}</span></div>
      </Link>}
    </section>
  );
}
