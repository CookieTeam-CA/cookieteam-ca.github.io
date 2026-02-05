"use client";

import { Gavel, AlertCircle, X, Check } from "lucide-react";
import { banPlayer } from "../../actions/player-actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface BanPlayerButtonProps {
    minecraftName: string;
    isAdmin: boolean;
    className?: string;
}

export default function BanPlayerButton({ minecraftName, isAdmin, className = "" }: BanPlayerButtonProps) {
    const [isBanning, setIsBanning] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [reason, setReason] = useState("Regelverstoß");
    const router = useRouter();

    if (!isAdmin) return null;

    const handleBan = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsBanning(true);
        const result = await banPlayer(minecraftName, reason);
        
        if (result.success) {
            router.refresh();
            setShowConfirm(false);
        } else {
            alert(`Fehler: ${result.error}`);
            setShowConfirm(false);
        }
        setIsBanning(false);
    };

    if (showConfirm) {
        return (
            <div 
                className={`absolute top-2 left-2 flex flex-col gap-2 bg-red-700 rounded-lg p-2 z-30 shadow-2xl border border-red-400/30 animate-in fade-in zoom-in duration-200 min-w-[200px] ${className}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <Gavel size={14} className="text-white" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Bannen?</span>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <input 
                        type="text" 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Grund..."
                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                        autoFocus
                    />
                    
                    <div className="flex justify-end gap-1.5">
                        <button 
                            onClick={() => setShowConfirm(false)}
                            className="px-2 py-1 hover:bg-white/10 rounded transition-colors text-white/70 text-[10px] font-medium"
                            title="Abbrechen"
                        >
                            Abbrechen
                        </button>
                        <button 
                            onClick={handleBan}
                            disabled={isBanning}
                            className="px-2 py-1 bg-white text-red-700 rounded hover:bg-zinc-100 transition-colors text-[10px] font-bold"
                            title="Bestätigen"
                        >
                            {isBanning ? <div className="w-3 h-3 border-2 border-red-700/30 border-t-red-700 rounded-full animate-spin mx-auto" /> : "Bestätigen"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <button 
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowConfirm(true);
            }}
            className={`absolute top-2 left-2 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-all z-20 backdrop-blur-sm cursor-pointer shadow-lg border border-red-400/20 ${className}`}
            title="Spieler bannen (Admin)"
        >
            <Gavel size={16} />
        </button>
    );
}
