"use client";

import { Fragment, useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "../i18n/client";

export interface GalleryBatch {
    items: { id: string | number; card: ReactNode }[];
    hasMore: boolean;
}

interface InfiniteGalleryProps {
    initialBatch: GalleryBatch;
    initialPage: number;
    loadPageAction: (page: number) => Promise<GalleryBatch>;
    className: string;
}

export default function InfiniteGallery({ initialBatch, initialPage, loadPageAction, className }: InfiniteGalleryProps) {
    const { t } = useTranslations();
    const [items, setItems] = useState(initialBatch.items);
    const [hasMore, setHasMore] = useState(initialBatch.hasMore);
    const [error, setError] = useState(false);
    const [pending, startTransition] = useTransition();
    const page = useRef(initialPage);
    const loading = useRef(false);
    const sentinel = useRef<HTMLDivElement>(null);

    const loadMore = useCallback(() => {
        if (loading.current || !hasMore) return;
        loading.current = true;
        setError(false);
        startTransition(async () => {
            try {
                const batch = await loadPageAction(page.current + 1);
                // Updates after await need a new transition to keep streamed cards from hiding the grid.
                startTransition(() => {
                    setItems(previous => {
                        const seen = new Set(previous.map(item => item.id));
                        return [...previous, ...batch.items.filter(item => {
                            if (seen.has(item.id)) return false;
                            seen.add(item.id);
                            return true;
                        })];
                    });
                    setHasMore(batch.hasMore);
                });
                page.current += 1;
            } catch {
                setError(true);
            } finally {
                loading.current = false;
            }
        });
    }, [hasMore, loadPageAction]);

    useEffect(() => {
        if (!hasMore || pending || error || !sentinel.current || typeof IntersectionObserver === "undefined") return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) loadMore();
        }, { rootMargin: "400px" });
        observer.observe(sentinel.current);
        return () => observer.disconnect();
    }, [hasMore, pending, error, loadMore, items]);

    return (
        <>
            <div className={className} aria-busy={pending}>
                {items.map(item => <Fragment key={item.id}>{item.card}</Fragment>)}
            </div>
            <div ref={sentinel} className="flex min-h-24 flex-col items-center justify-center gap-3 py-6">
                <p role="status" className="text-sm text-zinc-400">
                    {error ? t("Could not load more results.") : pending ? t("Loading more…") : !hasMore ? t("All results loaded.") : ""}
                </p>
                {hasMore && <Button variant="outline" disabled={pending} onClick={loadMore}>
                    {error ? t("Try again") : t("Load more")}
                </Button>}
            </div>
        </>
    );
}
