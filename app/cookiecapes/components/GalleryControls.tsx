"use client";

import { useTranslations } from "@/app/cookiecapes/i18n/client";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";

import GallerySearch from "./GallerySearch";

export default function GalleryControls() {
  const { t } = useTranslations();
    const router = useRouter();
    const searchParams = useSearchParams();
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
            <GallerySearch placeholder={t("Search capes...")} />

            <div className="flex gap-2">
                <div className="relative">
                    <select
                        aria-label={t("Popularity")}
                        value={searchParams.get("sort") || "active_user_count"}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="appearance-none bg-zinc-900 border border-white/10 rounded-lg pl-10 pr-8 py-3 text-white focus:border-orange-500 focus:outline-none cursor-pointer hover:bg-zinc-800 transition-colors"
                    >
                        <option value="active_user_count">{t("Popularity")}</option>
                        <option value="last_edited">{t("Date")}</option>
                        <option value="cape_name">Name</option>
                        <option value="cape_id">ID</option>
                    </select>
                    <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={18} />
                </div>

                <Button
                    variant="outline" size="icon-lg"
                    onClick={toggleOrder}
                    className="group h-auto self-stretch hover:border-orange-500/50"
                    title={searchParams.get("order") === "asc" ? t("Ascending") : t("Descending")}
                >
                    <ArrowUpDown
                        size={20}
                        className={`text-zinc-400 group-hover:text-white transition-transform duration-300 ${searchParams.get("order") === "asc" ? "rotate-180" : ""}`}
                    />
                </Button>
            </div>
        </div>
    );
}
