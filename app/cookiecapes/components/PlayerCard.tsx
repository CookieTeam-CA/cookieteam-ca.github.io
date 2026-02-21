import { Player } from "../lib/api";
import CapeViewer from "./CapeViewer";
import { User, ShieldAlert } from "lucide-react";
import { auth } from "../../../auth";
import BanPlayerButton from "./BanPlayerButton";
import Link from "next/link";

interface PlayerCardProps {
    player: Player;
}

export default async function PlayerCard({ player }: PlayerCardProps) {
    const session = await auth();
    const adminIds = process.env.ADMIN_DISCORD_IDS?.split(",") || [];
    const isAdmin = session?.user?.id && adminIds.includes(session.user.id) ? true : false;

    const capeUrl = player.current_cape_id 
        ? `/api/proxy?url=${encodeURIComponent(`https://api.cookieattack.de:8989/capes/${player.current_cape_id}.png`)}`
        : "";

    return (
        <div className="group relative bg-zinc-900 border border-white/10 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 flex flex-col">
            
            {!player.banned && (
                <BanPlayerButton minecraftName={player.minecraft_name} isAdmin={isAdmin} />
            )}

            <div className="relative w-full aspect-[3/4] bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <CapeViewer 
                        capeUrl={capeUrl} 
                        minecraftName={player.minecraft_name} 
                    />
                </div>
                
                {player.banned && (
                    <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-bold border border-red-400/50 flex items-center gap-1">
                        <ShieldAlert size={12} />
                        BANNED
                    </div>
                )}
            </div>

            <div className="p-4 bg-zinc-950/50 flex-1 flex flex-col items-center text-center">
                <Link href={`/cookiecapes/players/${player.minecraft_name}`} className="w-full">
                    <h3 className="font-bold text-white group-hover:text-orange-400 transition-colors truncate w-full mb-2">
                        {player.minecraft_name}
                    </h3>
                </Link>

                {player.cape_name ? (
                     <Link href={`/cookiecapes/capes/${player.current_cape_id}`} className="flex items-center justify-center gap-2 mb-1 w-full text-zinc-400 text-sm hover:text-orange-400 transition-colors">
                        <span className="truncate">Cape: {player.cape_name}</span>
                    </Link>
                ) : (
                    <div className="flex items-center justify-center gap-2 mb-1 w-full text-zinc-600 text-sm">
                        <span>Kein Cape</span>
                    </div>
                )}
                
                <div className="border-t border-white/5 w-full pt-3 mt-auto flex justify-center">
                    <Link href={`/cookiecapes/players/${player.minecraft_name}`} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-orange-500 transition-colors">
                        <User size={14} />
                        <span>Profile View</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
