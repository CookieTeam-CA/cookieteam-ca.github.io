"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, ArrowUpDown } from "lucide-react";

import GallerySearch from "./GallerySearch";

export default function PlayerGalleryControls() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toggleOrder = () => {
        const currentOrder = searchParams.get("order") || "asc";
        const newOrder = currentOrder === "desc" ? "asc" : "desc";
        const params = new URLSearchParams(searchParams);
        params.set("order", newOrder);
        router.push(`?${params.toString()}`);
    };

    const toggleBanned = () => {
        const isBanned = searchParams.get("banned") === "true";
        const params = new URLSearchParams(searchParams);
        if (isBanned) {
            params.delete("banned");
        } else {
            params.set("banned", "true");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            <GallerySearch placeholder="Suche nach Spielern..." />

            <div className="flex gap-2">
                <button
                    onClick={toggleOrder}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-4 flex items-center justify-center hover:bg-zinc-800 hover:border-orange-500/50 transition-colors group"
                    title={searchParams.get("order") === "desc" ? "Absteigend" : "Aufsteigend"}
                >
                    <ArrowUpDown 
                        size={20} 
                        className={`text-zinc-400 group-hover:text-white transition-transform duration-300 ${searchParams.get("order") === "desc" ? "rotate-180" : ""}`} 
                    />
                </button>

                <button
                    onClick={toggleBanned}
                    className={`px-4 py-3 rounded-lg border transition-all flex items-center gap-2 font-medium ${
                        searchParams.get("banned") === "true" 
                            ? "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30" 
                            : "bg-zinc-900 border-white/10 text-zinc-400 hover:bg-zinc-800 hover:border-white/20"
                    }`}
                    title={searchParams.get("banned") === "true" ? "Gesperrte Spieler ausblenden" : "Gesperrte Spieler anzeigen"}
                >
                    <ShieldAlert size={18} />
                </button>
            </div>
        </div>
    );
}
