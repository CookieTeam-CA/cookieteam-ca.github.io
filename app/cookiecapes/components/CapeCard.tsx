import { getTranslations } from "@/app/cookiecapes/i18n/server";
import VerificationBadge from "./VerificationBadge";
import { Cape } from "../lib/api";
import CapeViewer from "./CapeViewer";
import { Users } from "lucide-react";
import { getCookieCapesAdmin } from "@/lib/cookiecapes-admin";
import DeleteCapeButton from "./DeleteCapeButton";
import BanPlayerButton from "./BanPlayerButton";
import Link from "next/link";

interface CapeCardProps {
    cape: Cape;
    returnTo?: string;
}

export default async function CapeCard({ cape, returnTo }: CapeCardProps) {
  const { t, number } = await getTranslations();
    const isAdmin = await getCookieCapesAdmin();

    const capeUrl = cape.cape_image_url;

    return (
        <div className="group relative bg-zinc-900 border border-white/10 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 flex flex-col">

            <div className="flex gap-2">
                <DeleteCapeButton capeId={cape.cape_id} isAdmin={isAdmin} />
                <BanPlayerButton minecraftName={cape.minecraft_name} isAdmin={isAdmin} className="left-12" />
            </div>

            <div className="relative w-full aspect-3/4 bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <CapeViewer
                        animateOnHover
                        capeUrl={capeUrl}
                        minecraftName={cape.minecraft_name}
                    />
                </div>

                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-zinc-400 font-mono border border-white/5">
                    #{cape.cape_id}
                </div>
            </div>

            <div className="p-4 bg-zinc-950/50 flex-1 flex flex-col items-center text-center">
                <Link prefetch={false} href={`/cookiecapes/capes/${cape.cape_id}${returnTo ? "?returnTo=" + encodeURIComponent(returnTo) : ""}`} className="w-full mb-2 group-hover:text-orange-400 transition-colors">
                    <h2 className="font-bold text-white truncate w-full" title={cape.cape_name}>
                        {cape.cape_name} <VerificationBadge verification={cape.verification} />
                    </h2>
                </Link>

                <Link prefetch={false} href={`/cookiecapes/players/${cape.minecraft_name}`} className="flex items-center justify-center gap-2 mb-3 w-full group/player hover:text-orange-400 transition-colors">
                    <img
                        src={`https://minotar.net/helm/${cape.minecraft_name}/20`}
                        alt=""
                        width={20} height={20}
                        className="w-5 h-5 rounded-sm"
                    />
                    <span className="text-sm text-zinc-400 group-hover/player:text-orange-400 transition-colors truncate max-w-37.5">{cape.minecraft_name}</span>
                </Link>

                <div className="border-t border-white/5 w-full pt-3 mt-auto flex justify-center">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 group-hover:text-zinc-400 transition-colors">
                        <Users size={14} />
                        <span>{number(cape.active_user_count || 0)} {t("Users")}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
