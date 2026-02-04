import { getCapesSorted, SortBy, Order } from "../lib/api";
import CapeCard from "../components/CapeCard";
import Pagination from "../components/Pagination";
import GalleryControls from "../components/GalleryControls";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Capes - CookieCapes",
};

export const revalidate = 0;

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CapesGalleryPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const limit = 8;
    const sort = (params.sort as SortBy) || "active_user_count";
    const order = (params.order as Order) || "desc";
    const query = (params.q as string) || "";

    const data = await getCapesSorted(page, limit, sort, order, query);

    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">

            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                <div className="text-center mb-16">
                    <h1 className="font-nexa text-4xl md:text-6xl mb-4">
                        Entdecke <span className="text-orange-500">Capes</span>
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mx-auto">
                        Durchsuche die Community-Galerie. Finde dein Lieblings-Cape oder lass dich inspirieren.
                    </p>
                </div>

                <GalleryControls />

                {data && data.capes.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {data.capes.map((cape) => (
                                <CapeCard key={cape.cape_id} cape={cape} />
                            ))}
                        </div>
                        <Pagination 
                            currentPage={page} 
                            totalCount={data.total_count} 
                            limit={limit} 
                        />
                    </>
                ) : (
                    <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-white/5">
                        <p className="text-zinc-400 text-lg">Keine Capes gefunden.</p>
                        <p className="text-zinc-600 text-sm mt-2">Versuche es mit einem anderen Suchbegriff.</p>
                    </div>
                )}
                
                 <footer className="mt-20 border-t border-white/10 pt-8 text-center text-gray-500 text-sm mb-10">
                    <p>&copy; {new Date().getFullYear()} CookieTeam. Alle Rechte vorbehalten.</p>
                </footer>
            </div>
        </main>
    );
}
