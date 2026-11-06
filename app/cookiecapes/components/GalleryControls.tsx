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
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="gallery-controls mb-8 flex flex-col gap-2 md:flex-row">
            <GallerySearch placeholder={t("Search capes...")} />

            <div className="flex gap-2">
                <div className="relative">
                    <select
                        aria-label={t("Popularity")}
                        value={searchParams.get("sort") || "active_user_count"}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="gallery-control w-full appearance-none pl-10 pr-4 cursor-pointer"
                    >
                        <option value="active_user_count">{t("Popularity")}</option>
                        <option value="last_edited">{t("Date")}</option>
                        <option value="cape_name">Name</option>
                        <option value="cape_id">ID</option>
                    </select>
                    <SlidersHorizontal aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>

                <Button
                    variant="outline" size="icon-lg"
                    onClick={toggleOrder}
                    className="gallery-control size-12"
                    aria-label={searchParams.get("order") === "asc" ? t("Ascending") : t("Descending")}
                    title={searchParams.get("order") === "asc" ? t("Ascending") : t("Descending")}
                >
                    <ArrowUpDown
                        aria-hidden="true"
                        className={searchParams.get("order") === "asc" ? "rotate-180" : undefined}
                    />
                </Button>
            </div>
        </div>
    );
}
