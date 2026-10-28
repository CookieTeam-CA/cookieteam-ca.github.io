import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { Metadata } from "next";
import Footer from "../../components/Footer"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
    title: t("Players"),
};
}

import { getPlayersSorted, Order } from "../lib/api";
import PlayerCard from "../components/PlayerCard";
import Pagination from "../components/Pagination";
import PlayerGalleryControls from "../components/PlayerGalleryControls";

export const revalidate = 0;

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CookiePlayerPage({ searchParams }: PageProps) {
  const { t, locale } = await getTranslations();
    const params = await searchParams;
    const requestedPage = typeof params.page === "string" ? Number(params.page) : 1;
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = 8;
    const sort = typeof params.sort === "string" && ["minecraft_name", "minecraft_uuid", "current_cape_id", "banned"].includes(params.sort) ? params.sort : "minecraft_name";
    const order: Order = params.order === "desc" ? "desc" : "asc";
    const query = typeof params.q === "string" ? params.q : "";
    const banned = params.banned === 'true';

    const data = await getPlayersSorted(page, limit, sort, order, query || "_", banned);
    const paginatedPlayers = data.players.filter(player => player.minecraft_name?.trim());
    const totalCount = data.total_count;

    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">

            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                <div className="text-center mb-16">
                    <h1 className="font-nexa text-4xl md:text-6xl mb-4">
                        {t("Our")} <span className="text-orange-500">{t("Players")}</span>
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mx-auto">
                        {t("Find other players, view their capes, or browse the list.")}
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
                        <p className="text-zinc-400 text-lg">{t("No players found.")}</p>
                        <p className="text-zinc-600 text-sm mt-2">{t("Try another name.")}</p>
                    </div>
                )}

                <Footer locale={locale} />
            </div>
        </main>
    );
}
