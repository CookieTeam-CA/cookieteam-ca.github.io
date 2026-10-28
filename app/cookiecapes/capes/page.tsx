import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { getCapesSorted, SortBy, Order } from "../lib/api";
import CapeCard from "../components/CapeCard";
import Pagination from "../components/Pagination";
import GalleryControls from "../components/GalleryControls";
import { Metadata } from "next";
import Footer from "../../components/Footer";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Capes",
};
}

export const revalidate = 0;

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CapesGalleryPage({ searchParams }: PageProps) {
  const { t, locale } = await getTranslations();
    const params = await searchParams;
    const requestedPage = typeof params.page === "string" ? Number(params.page) : 1;
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = 8;
    const sort: SortBy = typeof params.sort === "string" && ["active_user_count", "last_edited", "cape_name", "cape_id"].includes(params.sort) ? params.sort as SortBy : "active_user_count";
    const order: Order = params.order === "asc" ? "asc" : "desc";
    const query = typeof params.q === "string" ? params.q : "";

    const data = await getCapesSorted(page, limit, sort, order, query);

    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">

            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                <div className="text-center mb-16">
                    <h1 className="font-nexa text-4xl md:text-6xl mb-4">
                        {t("Discover")} <span className="text-orange-500">Capes</span>
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mx-auto">
                        {t("Browse the community gallery. Find your favourite cape or get inspired.")}
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
                        <p className="text-zinc-400 text-lg">{t("No capes found.")}</p>
                        <p className="text-zinc-600 text-sm mt-2">{t("Try another search term.")}</p>
                    </div>
                )}   
            </div>
            <Footer locale={locale} />
        </main>
    );
}
