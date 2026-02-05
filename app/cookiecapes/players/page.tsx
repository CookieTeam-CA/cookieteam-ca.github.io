import { Metadata } from "next";
import Footer from "../../components/Footer"

export const metadata: Metadata = {
  title: "Spieler - CookieCapes",
};

import { getPlayersSorted, SortBy, Order } from "../lib/api";
import PlayerCard from "../components/PlayerCard";
import Pagination from "../components/Pagination";
import PlayerGalleryControls from "../components/PlayerGalleryControls";

export const revalidate = 0;

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CookiePlayerPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const limit = 8;
    const sort = (params.sort as string) || "minecraft_name";
    const order = (params.order as Order) || "asc";
    const query = (params.q as string) || "";
    const banned = params.banned === 'true';

    const data = await getPlayersSorted(1, undefined, sort, order, query, banned);
    
    const filteredPlayers = data?.players.filter(player => player.minecraft_name && player.minecraft_name.trim() !== "") || [];
    
    const totalCount = filteredPlayers.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginatedPlayers = filteredPlayers.slice(startIndex, startIndex + limit);

    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
             
             <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                <div className="text-center mb-16">
                    <h1 className="font-nexa text-4xl md:text-6xl mb-4">
                        Unsere <span className="text-orange-500">Spieler</span>
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mx-auto">
                        Finde andere Spieler, sieh dir ihre Capes an oder durchsuche die Liste.
                    </p>
                </div>

                <PlayerGalleryControls />

                {paginatedPlayers.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {paginatedPlayers.map((player) => (
                                <PlayerCard key={player.minecraft_uuid} player={player} />
                            ))}
                        </div>
                        <Pagination 
                            currentPage={page} 
                            totalCount={totalCount} 
                            limit={limit} 
                        />
                    </>
                ) : (
                    <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-white/5">
                        <p className="text-zinc-400 text-lg">Keine Spieler gefunden.</p>
                        <p className="text-zinc-600 text-sm mt-2">Versuche es mit einem anderen Namen.</p>
                    </div>
                )}
                
                 <Footer/>
            </div>
        </main>
    );
}