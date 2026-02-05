"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ShieldAlert, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export default function PlayerGalleryControls() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("q") || "");

    useEffect(() => {
        const timer = setTimeout(() => {
             const params = new URLSearchParams(searchParams);
             if (search) {
                 params.set("q", search);
             } else {
                 params.delete("q");
             }
             
             if (search !== (searchParams.get("q") || "")) {
                params.set("page", "1");
                router.push(`?${params.toString()}`);
             }
        }, 500);

        return () => clearTimeout(timer);
    }, [search, router, searchParams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (search) {
            params.set("q", search);
        } else {
            params.delete("q");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

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
            <form onSubmit={handleSearch} className="flex-1 relative">
                <input
                    type="text"
                    placeholder="Suche nach Spielern..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-orange-500 focus:outline-none transition-colors"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            </form>

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
