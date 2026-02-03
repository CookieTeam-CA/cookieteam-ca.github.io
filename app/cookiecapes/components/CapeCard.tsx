import { Cape } from "../lib/api";
import Cape3DViewer from "./Cape3DViewer";
import { Users } from "lucide-react";

interface CapeCardProps {
    cape: Cape;
}

export default function CapeCard({ cape }: CapeCardProps) {
    // State removed as hover copy is removed

    return (
        <div className="group relative bg-zinc-900 border border-white/10 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 flex flex-col">
            {/* Image Preview Container - Portrait */}
            <div className="relative w-full aspect-[3/4] bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <Cape3DViewer 
                        capeUrl={cape.cape_image_url} 
                        minecraftName={cape.minecraft_name} 
                    />
                </div>
                
                {/* ID Badge */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-zinc-400 font-mono border border-white/5">
                    #{cape.cape_id}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 bg-zinc-950/50 flex-1 flex flex-col items-center text-center">
                <h3 className="font-bold text-white group-hover:text-orange-400 transition-colors truncate w-full mb-2" title={cape.cape_name}>
                    {cape.cape_name}
                </h3>

                <div className="flex items-center justify-center gap-2 mb-3 w-full">
                    <img 
                        src={`https://minotar.net/avatar/${cape.minecraft_name}/20`} 
                        alt={cape.minecraft_name} 
                        className="w-5 h-5 rounded-sm"
                    />
                    <span className="text-sm text-zinc-400 truncate max-w-[150px]">{cape.minecraft_name}</span>
                </div>

                <div className="border-t border-white/5 w-full pt-3 mt-auto flex justify-center">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
                        <Users size={14} />
                        <span>{cape.active_user_count || 0} Nutzer</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
