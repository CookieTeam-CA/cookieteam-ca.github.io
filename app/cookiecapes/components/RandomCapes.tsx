import { getTranslations } from "@/app/cookiecapes/i18n/server";
import type { Cape } from "../lib/api";
import CapeCard from "./CapeCard";

interface RandomCapesProps {
  capes: Cape[];
}

export default async function RandomCapes({ capes }: RandomCapesProps) {
  const { t } = await getTranslations();
  if (capes.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      <h2 className="font-nexa text-3xl md:text-4xl text-foreground mb-8">
        {t("Discover")} <span className="text-primary">Community</span> Capes
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {capes.map(cape => <CapeCard key={cape.cape_id} cape={cape} />)}
      </div>
    </div>
  );
}
