"use client";
import { useTranslations } from "@/app/cookiecapes/i18n/client";
import VerificationBadge from "./VerificationBadge";

import { Cape } from "../lib/api";
import StaticPreview from "./StaticPreview";
import { capePreviewUrl } from "../lib/preview-url";

interface RandomCapesProps {
  capes: Cape[];
}

export default function RandomCapes({ capes }: RandomCapesProps) {
  const { t } = useTranslations();
  if (capes.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-20">
      <h2 className="font-nexa text-3xl md:text-5xl text-white text-center mb-12">
        {t("Discover")} <span className="text-orange-500">Community</span> Capes
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {capes.map((cape) => (
          <div key={cape.cape_id} className="cape-card flex flex-col items-center bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm gap-4 transition-transform">
            <div className="w-full h-75 relative flex items-center justify-center">
              <StaticPreview
                src={capePreviewUrl(cape.cape_id, cape.last_edited)}
                alt={`${cape.cape_name}, cape by ${cape.minecraft_name}`}
                viewerFallback={{ capeUrl: cape.cape_image_url, minecraftName: cape.minecraft_uuid }}
              />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-xl text-white">{cape.cape_name} <VerificationBadge verification={cape.verification} /></h3>
              <p className="text-zinc-400 text-sm">{t("by")} {cape.minecraft_name}</p>
              <div className="mt-2 text-xs text-orange-400 font-mono bg-orange-500/10 px-2 py-1 rounded">
                ID: {cape.cape_id}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
