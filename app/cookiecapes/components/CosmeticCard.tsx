"use client";

import Link from "next/link";
import { Gauge, Users } from "lucide-react";
import { useTranslations } from "@/app/cookiecapes/i18n/client";
import type { MessageKey } from "@/app/cookiecapes/i18n/messages";
import type { CosmeticSlot, CosmeticSummary } from "../lib/cosmetic-types";

export const SLOT_LABELS: Record<CosmeticSlot, MessageKey> = {
    head: "Head",
    face: "Face",
    back: "Back",
    shoulder: "Shoulder",
    aura: "Particles",
};

const RATING_LABELS: MessageKey[] = ["Very light", "Light", "Medium", "Heavy", "Very heavy"];
const RATING_COLOURS = ["text-emerald-400", "text-lime-400", "text-yellow-400", "text-orange-400", "text-red-400"];

export function PerformanceBadge({ rating, score }: { rating: number; score?: number }) {
    const { t } = useTranslations();
    const index = Math.min(4, Math.max(0, rating - 1));
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${RATING_COLOURS[index]}`}
            title={score === undefined ? undefined : t("Performance score {score}/100", { score })}>
            <Gauge size={14} aria-hidden="true" />
            {t("Performance {rating}/5", { rating })} · {t(RATING_LABELS[index])}
        </span>
    );
}

export default function CosmeticCard({ cosmetic, href, children }: { cosmetic: CosmeticSummary; href?: string; children?: React.ReactNode }) {
    const { t } = useTranslations();
    const link = href ?? `/cookiecapes/cosmetics/${cosmetic.cosmetic_id}`;
    return (
        <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50">
            <Link href={link} className="group block aspect-square bg-zinc-950/60 focus-visible:outline-2 focus-visible:outline-orange-400">
                {/* The API renders this preview once per revision and serves it cached. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cosmetic.preview_url} alt={t("Preview of {name}", { name: cosmetic.name })} width={512} height={512} loading="lazy" decoding="async"
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" style={{ imageRendering: "pixelated" }} />
            </Link>
            <div className="flex flex-1 flex-col gap-1 p-4">
                <div className="flex items-start justify-between gap-2">
                    <Link href={link} className="font-semibold text-white hover:text-primary line-clamp-1">{cosmetic.name}</Link>
                    <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-300">{t(SLOT_LABELS[cosmetic.slot])}</span>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-1">{t("by {name}", { name: cosmetic.owner_name })}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                    <PerformanceBadge rating={cosmetic.performance.rating} score={cosmetic.performance.score} />
                    {cosmetic.wearers !== undefined && <span className="inline-flex items-center gap-1 text-xs text-zinc-400"><Users size={14} aria-hidden="true" />{cosmetic.wearers}</span>}
                </div>
                {children}
            </div>
        </article>
    );
}
