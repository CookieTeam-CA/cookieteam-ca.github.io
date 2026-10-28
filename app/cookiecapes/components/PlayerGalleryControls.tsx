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
            <GallerySearch placeholder={t("Search players...")} />

            <div className="flex gap-2">
                <Button
                    variant="outline" size="icon-lg"
                    onClick={toggleOrder}
                    className="group h-12 hover:border-orange-500/50"
                    title={searchParams.get("order") === "desc" ? t("Descending") : t("Ascending")}
                >
                    <ArrowUpDown
                        size={20}
                        className={`text-zinc-400 group-hover:text-white transition-transform duration-300 ${searchParams.get("order") === "desc" ? "rotate-180" : ""}`}
                    />
                </Button>

                <Button
                    variant="outline" size="icon-lg"
                    onClick={toggleBanned}
                    aria-pressed={searchParams.get("banned") === "true"}
                    className={`h-12 ${searchParams.get("banned") === "true"
                            ? "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
                            : "text-zinc-400"
                        }`}
                    title={searchParams.get("banned") === "true" ? t("Hide banned players") : t("Show banned players")}
                >
                    <ShieldAlert size={18} />
                </Button>
            </div>
        </div>
    );
}
