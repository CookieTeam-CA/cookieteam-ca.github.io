"use client";

import { useState, useRef, useLayoutEffect } from "react";
import CapeViewer from "./CapeViewer";
import { ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import gsap from "gsap";

interface SkinHistoryEntry {
    hash: string;
    changed_at: string | Date;
}

interface ProfileSkinDisplayProps {
    currentCapeUrl: string | null;
    displayName: string;
    player: any;
    isCookieCapesUser: boolean;
    skinHistory?: SkinHistoryEntry[];
}

export default function ProfileSkinDisplay({
    currentCapeUrl,
    displayName,
    player,
    isCookieCapesUser,
    skinHistory = []
}: ProfileSkinDisplayProps) {
    const [activeSkinUrl, setActiveSkinUrl] = useState<string | undefined>(undefined);
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
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden aspect-[3/4] relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-10" />
                <div className="w-full h-full flex items-center justify-center">
                    <CapeViewer 
                        capeUrl={currentCapeUrl}
                        minecraftName={activeSkinUrl ? undefined : displayName}
                        skinUrl={activeSkinUrl}
                        animation="walk"
                    />
                </div>
                
                {player?.banned && (
                    <div className="absolute top-4 right-4 z-20 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white font-bold border border-red-400/50 flex items-center gap-2 shadow-lg shadow-red-900/20">
                        <ShieldAlert size={16} />
                        BANNED
                    </div>
                )}

                <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                    <h1 className="text-3xl font-nexa text-white mb-2 truncate">{displayName}</h1>
                    {isCookieCapesUser ? (
                        currentCapeUrl ? (
                            <div className="text-zinc-300 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Trägt Cape #{player.current_cape_id}
                            </div>
                        ) : (
                            <div className="text-zinc-500 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                                Kein Cape ausgerüstet
                            </div>
                        )
                    ) : (
                        <div className="text-zinc-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                            Kein CookieCapes Nutzer
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
                            <div 
                                key={i} 
                                className="group relative shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/5 hover:border-orange-500/50 transition-all w-13 h-13 flex flex-col items-center justify-center bg-black/20"
                                onMouseEnter={() => setActiveSkinUrl(`https://crafthead.net/skin/${skin.hash}`)}
                                onClick={() => setActiveSkinUrl(`https://crafthead.net/skin/${skin.hash}`)}
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
                            </div>
                        ))}
                    </div>
                    
                    {hasMore && (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-full mt-0.5 py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 cursor-pointer"
                        >
                            {isExpanded ? (
                                <>
                                    Weniger anzeigen
                                    <ChevronUp size={14} />
                                </>
                            ) : (
                                <>
                                    Mehr anzeigen ({reversedHistory.length - 7} weitere)
                                    <ChevronDown size={14} />
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
