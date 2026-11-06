"use client";

import { useTranslations } from "@/app/cookiecapes/i18n/client";
import { Button } from "@/components/ui/button";
import { useState, useRef, useLayoutEffect } from "react";
import CapeViewer from "./CapeViewer";
import { ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import GalleryLink from "./GalleryLink";
import gsap from "gsap";
import type { Player } from "../lib/api";
import { playerPreviewUrl } from "../lib/preview-url";

interface SkinHistoryEntry {
    hash: string;
    changed_at: string | Date;
    slim?: boolean;
}

interface ProfileSkinDisplayProps {
    currentCapeUrl: string | null;
    animationManifest?: string;
    displayName: string;
    uuid: string;
    player: Player | null;
    isCookieCapesUser: boolean;
    skinHistory?: SkinHistoryEntry[];
}

export default function ProfileSkinDisplay({
    currentCapeUrl,
    animationManifest,
    displayName,
    uuid,
    player,
    isCookieCapesUser,
    skinHistory = []
}: ProfileSkinDisplayProps) {
    const { t, number } = useTranslations();
    const [activeSkin, setActiveSkin] = useState<SkinHistoryEntry | undefined>(undefined);
    const activeSkinUrl = activeSkin ? `https://crafthead.net/skin/${activeSkin.hash}` : undefined;
    const [isExpanded, setIsExpanded] = useState(false);
    const gridRef = useRef<HTMLDivElement>(null);

    const reversedHistory = [...skinHistory].reverse();
    const hasMore = reversedHistory.length > 6;

    useLayoutEffect(() => {
        if (!gridRef.current) return;

        if (isExpanded) {
            gsap.to(gridRef.current, {
                height: "auto",
                duration: 0.4,
                ease: "power2.out"
            });
        } else {
            gsap.to(gridRef.current, {
                height: "56px",
                duration: 0.4,
                ease: "power2.inOut"
            });
        }
    }, [isExpanded]);

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden aspect-3/4 relative group">
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent pointer-events-none z-10" />
                <div className="w-full h-full flex items-center justify-center">
                    <CapeViewer
                        capeUrl={currentCapeUrl}
                        animationManifest={animationManifest}
                        minecraftName={activeSkinUrl ? undefined : displayName}
                        skinUrl={activeSkinUrl}
                        fallbackSrc={playerPreviewUrl(uuid, player?.last_edited, activeSkin)}
                        fallbackAlt={`${displayName}, ${activeSkin ? "selected historical skin" : "current Minecraft skin"}`}
                        animation="walk"
                    />
                </div>

                {player?.banned && (
                    <div className="absolute top-4 right-4 z-20 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white font-bold border border-red-400/50 flex items-center gap-2 shadow-lg shadow-red-900/20">
                        <ShieldAlert size={16} />
                        {t("BANNED")}
                    </div>
                )}

                <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                    <h1 className="text-3xl font-nexa text-white mb-2 truncate">{displayName}</h1>
                    {isCookieCapesUser ? (
                        currentCapeUrl ? (
                            <div className="text-zinc-300 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                {t("Cape:")}
                                <GalleryLink
                                    href={`/cookiecapes/capes/${player?.current_cape_id}`}
                                    returnTo={`/cookiecapes/players/${displayName}`}
                                    className="min-w-0 truncate font-bold hover:text-orange-400 focus-visible:text-orange-400 transition-colors"
                                >
                                    {player?.cape_name || t("Show cape")}
                                </GalleryLink>
                            </div>
                        ) : (
                            <div className="text-zinc-500 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                                {t("No cape equipped")}
                            </div>
                        )
                    ) : (
                        <div className="text-zinc-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                            {t("Not a CookieCapes user")}
                        </div>
                    )}
                </div>
            </div>

            {skinHistory && skinHistory.length > 0 && (
                <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-zinc-300">Skins ({skinHistory.length})</h3>
                    </div>
                    <div
                        ref={gridRef}
                        className="flex flex-wrap gap-2 overflow-hidden"
                        style={{ height: "56px" }}
                    >
                        {reversedHistory.map((skin, i) => (
                            <Button type="button" variant="ghost" size="icon-lg"
                                key={i}
                                className="group relative h-13 w-13 shrink-0 overflow-hidden border border-white/5 bg-black/20 hover:border-orange-500/50"
                                aria-label={t("Show skin {number}", { number: i + 1 })}
                                onMouseEnter={() => setActiveSkin(skin)}
                                onFocus={() => setActiveSkin(skin)}
                                onClick={() => setActiveSkin(skin)}
                            >
                                <Image
                                    src={`https://crafthead.net/avatar/${skin.hash}`}
                                    alt={`Skin ${i + 1}`}
                                    width={40}
                                    height={40}
                                    unoptimized
                                    className="object-contain group-hover:scale-110 transition-transform"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                            </Button>
                        ))}
                    </div>

                    {hasMore && (
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="mt-0.5 w-full text-xs text-zinc-500 hover:text-white"
                        >
                            {isExpanded ? (
                                <>
                                    {t("Show less")}
                                    <ChevronUp size={14} />
                                </>
                            ) : (
                                <>
                                    {t("Show more ({count} more)", { count: number(reversedHistory.length - 6) })}
                                    <ChevronDown size={14} />
                                </>
                            )}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
