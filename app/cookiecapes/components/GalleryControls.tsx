"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export default function GalleryControls() {
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

    const handleSortChange = (sort: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("sort", sort);
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    const toggleOrder = () => {
        const currentOrder = searchParams.get("order") || "desc";
        const newOrder = currentOrder === "desc" ? "asc" : "desc";
        const params = new URLSearchParams(searchParams);
        params.set("order", newOrder);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            <form onSubmit={handleSearch} className="flex-1 relative">
                <input
                    type="text"
                    placeholder="Suche nach Capes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-orange-500 focus:outline-none transition-colors"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            </form>

            <div className="flex gap-2">
                <div className="relative">
                    <select
                        value={searchParams.get("sort") || "active_user_count"}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="appearance-none bg-zinc-900 border border-white/10 rounded-lg pl-10 pr-8 py-3 text-white focus:border-orange-500 focus:outline-none cursor-pointer hover:bg-zinc-800 transition-colors"
                    >
                        <option value="active_user_count">Beliebtheit</option>
                        <option value="last_edited">Datum</option>
                        <option value="cape_name">Name</option>
                        <option value="cape_id">ID</option>
                    </select>
                    <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={18} />
                </div>

                <button
                    onClick={toggleOrder}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-4 flex items-center justify-center hover:bg-zinc-800 hover:border-orange-500/50 transition-colors group"
                    title={searchParams.get("order") === "asc" ? "Aufsteigend" : "Absteigend"}
                >
                    <ArrowUpDown 
                        size={20} 
                        className={`text-zinc-400 group-hover:text-white transition-transform duration-300 ${searchParams.get("order") === "asc" ? "rotate-180" : ""}`} 
                    />
                </button>
            </div>
        </div>
    );
}
