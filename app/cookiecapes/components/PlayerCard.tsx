import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { API_BASE_URL, Player } from "../lib/api";
import StaticPreview from "./StaticPreview";
import { animatedPreviewUrl, playerPreviewUrl } from "../lib/preview-url";
import { ShieldAlert } from "lucide-react";
import { getCookieCapesAdmin } from "@/lib/cookiecapes-admin";
import BanPlayerButton from "./BanPlayerButton";
import Link from "next/link";
import GalleryLink from "./GalleryLink";

interface PlayerCardProps {
    player: Player;
    returnTo?: string;
}

export default async function PlayerCard({ player, returnTo = "/cookiecapes/players" }: PlayerCardProps) {
  const { t } = await getTranslations();
    const isAdmin = await getCookieCapesAdmin();

    return (
        <div className="group relative bg-card border border-border rounded-2xl overflow-hidden transition-colors duration-200 hover:border-white/25 flex flex-col">

            {!player.banned && (
                <BanPlayerButton minecraftName={player.minecraft_name} isAdmin={isAdmin} />
            )}

            <div className="preview-surface player-preview-surface relative w-full aspect-square flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center p-3">
                    <StaticPreview
                        src={playerPreviewUrl(player.minecraft_uuid, player.last_edited)}
                        animatedSrc={player.current_cape_id != null ? animatedPreviewUrl(playerPreviewUrl(player.minecraft_uuid, player.last_edited)) : undefined}
                        alt={player.cape_name ? `${player.minecraft_name} wearing ${player.cape_name}` : `${player.minecraft_name}, Minecraft skin`}
                        viewerFallback={{
                            capeUrl: player.current_cape_id != null ? player.cape_image_url || `${API_BASE_URL}/capes/${player.current_cape_id}.png` : null,
                            minecraftName: player.minecraft_uuid,
                        }}
                    />
                </div>

                {player.current_cape_id != null && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-zinc-400 font-mono border border-white/5">
                        #{player.current_cape_id}
                    </div>
                )}

                {player.banned && (
                    <div className="absolute bottom-2 right-2 bg-red-500/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-bold border border-red-400/50 flex items-center gap-1">
                        <ShieldAlert size={12} />
                        {t("BANNED")}
                    </div>
                )}
            </div>

            <div className="p-3 sm:p-5 flex-1 flex flex-col items-start text-left">
                <Link prefetch={false} href={`/cookiecapes/players/${player.minecraft_name}`} className="max-w-full text-white hover:text-orange-400 focus-visible:text-orange-400 transition-colors mb-2">
                    <h3 className="font-bold truncate" title={player.minecraft_name}>
                        {player.minecraft_name}
                    </h3>
                </Link>

                {player.cape_name ? (
                    <GalleryLink prefetch={false} href={`/cookiecapes/capes/${player.current_cape_id}`} returnTo={returnTo} className="flex items-center justify-center gap-2 mb-1 max-w-full text-zinc-400 text-sm hover:text-orange-400 focus-visible:text-orange-400 transition-colors">
                        <span className="truncate">{t("Cape:")} {player.cape_name}</span>
                    </GalleryLink>
                ) : (
                    <div className="flex items-center gap-2 mb-1 w-full text-zinc-400 text-sm">
                        <span>{t("No cape")}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
