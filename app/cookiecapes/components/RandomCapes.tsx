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
    <div className="w-full max-w-7xl mx-auto px-6 py-20">
      <h2 className="font-nexa text-3xl md:text-5xl text-white text-center mb-12">
        {t("Discover")} <span className="text-orange-500">Community</span> Capes
      </h2>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
        {capes.map(cape => <CapeCard key={cape.cape_id} cape={cape} />)}
      </div>
    </div>
  );
}
