import { getTranslations } from "@/app/cookiecapes/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { listCosmetics, type CosmeticSort } from "../lib/api";
import { COSMETIC_SLOTS, type CosmeticSlot } from "../lib/cosmetic-types";
import CosmeticCard, { SLOT_LABELS } from "../components/CosmeticCard";
import Pagination from "../components/Pagination";
import Footer from "../../components/Footer";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Cosmetics" };
}

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const SORTS: CosmeticSort[] = ["newest", "popular", "name"];

export default async function CosmeticsGalleryPage({ searchParams }: PageProps) {
    const { t } = await getTranslations();
    const params = await searchParams;
    const requestedPage = typeof params.page === "string" ? Number(params.page) : 1;
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const slot = COSMETIC_SLOTS.includes(params.slot as CosmeticSlot) ? params.slot as CosmeticSlot : undefined;
    const sort = SORTS.includes(params.sort as CosmeticSort) ? params.sort as CosmeticSort : "newest";
    const requestedRating = Number(params.rating);
    const maxRating = Number.isInteger(requestedRating) && requestedRating >= 1 && requestedRating <= 5 ? requestedRating : 5;
    const limit = 24;
    const data = await listCosmetics({ page, limit, slot, sortBy: sort, maxRating }).catch(() => null);

    const href = (change: Record<string, string | undefined>) => {
        const query = new URLSearchParams();
        const next = { slot, sort, rating: maxRating === 5 ? undefined : String(maxRating), ...change };
        for (const [key, value] of Object.entries(next)) if (value) query.set(key, value);
        return `/cookiecapes/cosmetics${query.size ? `?${query}` : ""}`;
    };
    const chip = (active: boolean) => `rounded-full border px-3 py-1.5 text-sm transition-colors ${active ? "border-primary bg-primary/15 text-white" : "border-white/10 text-zinc-400 hover:text-white"}`;
    const sortLabels: Record<CosmeticSort, string> = { newest: t("Newest"), popular: t("Popular"), name: t("Name") };

    return (
        <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-6 pt-36 pb-20">
                <h1 className="font-nexa text-4xl md:text-5xl mb-4">
                    {t("Discover")} <span className="text-primary">Cosmetics</span>
                </h1>
                <p className="text-zinc-400 max-w-2xl mb-8">
                    {t("Hats, wings, particles and more from the community. Wear up to three at once, one per type.")}
                </p>
                <nav aria-label={t("Filter cosmetics")} className="mb-8 flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                        <Link href={href({ slot: undefined, page: undefined })} className={chip(!slot)} aria-current={!slot ? "page" : undefined}>{t("All")}</Link>
                        {COSMETIC_SLOTS.map(value => (
                            <Link key={value} href={href({ slot: value })} className={chip(slot === value)} aria-current={slot === value ? "page" : undefined}>{t(SLOT_LABELS[value])}</Link>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        {SORTS.map(value => <Link key={value} href={href({ sort: value })} className={chip(sort === value)}>{sortLabels[value]}</Link>)}
                        <span className="ml-2 text-zinc-500">{t("Max. performance impact")}</span>
                        {[1, 2, 3, 4, 5].map(value => <Link key={value} href={href({ rating: value === 5 ? undefined : String(value) })} className={chip(maxRating === value)}>{value}</Link>)}
                    </div>
                </nav>
                {!data ? (
                    <p role="alert" className="text-zinc-400">{t("The API is temporarily unavailable or returned an invalid response.")}</p>
                ) : data.cosmetics.length === 0 ? (
                    <p className="text-zinc-400">{t("No cosmetics found.")}</p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {data.cosmetics.map(cosmetic => <CosmeticCard key={cosmetic.cosmetic_id} cosmetic={cosmetic} />)}
                        </div>
                        <div className="mt-10"><Pagination currentPage={page} totalCount={data.total_count} limit={limit} /></div>
                    </>
                )}
            </div>
            <Footer />
        </main>
    );
}
