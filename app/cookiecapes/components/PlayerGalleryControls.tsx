"use client";

import { useTranslations } from "@/app/cookiecapes/i18n/client";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, ArrowUpDown } from "lucide-react";

import GallerySearch from "./GallerySearch";

export default function PlayerGalleryControls() {
  const { t } = useTranslations();
    const router = useRouter();
    const searchParams = useSearchParams();
    const toggleOrder = () => {
        const currentOrder = searchParams.get("order") || "asc";
        const newOrder = currentOrder === "desc" ? "asc" : "desc";
        const params = new URLSearchParams(searchParams);
        params.set("order", newOrder);
        params.set("page", "1");
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
        <div className="gallery-controls mb-8 flex flex-col gap-2 md:flex-row">
            <GallerySearch placeholder={t("Search players...")} />

            <div className="flex gap-2">
                <Button
                    variant="outline" size="icon-lg"
                    onClick={toggleOrder}
                    className="gallery-control size-12"
                    aria-label={searchParams.get("order") === "desc" ? t("Descending") : t("Ascending")}
                    title={searchParams.get("order") === "desc" ? t("Descending") : t("Ascending")}
                >
                    <ArrowUpDown
                        aria-hidden="true"
                        className={searchParams.get("order") === "desc" ? "rotate-180" : undefined}
                    />
                </Button>

                <Button
                    variant="outline" size="icon-lg"
                    onClick={toggleBanned}
                    aria-pressed={searchParams.get("banned") === "true"}
                    className="gallery-control size-12"
                    aria-label={searchParams.get("banned") === "true" ? t("Hide banned players") : t("Show banned players")}
                    title={searchParams.get("banned") === "true" ? t("Hide banned players") : t("Show banned players")}
                >
                    <ShieldAlert aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}
