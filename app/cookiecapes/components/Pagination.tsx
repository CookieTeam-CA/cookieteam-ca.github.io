"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
    currentPage: number;
    totalCount: number;
    limit: number;
}

export default function Pagination({ currentPage, totalCount, limit }: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const totalPages = Math.ceil(totalCount / limit);

    if (totalPages <= 1) return null;

    const createPageURL = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', pageNumber.toString());
        return `?${params.toString()}`;
    };

    const handlePageChange = (page: number) => {
        router.push(createPageURL(page));
    };

    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];
        let l;

        range.push(1);
        for (let i = currentPage - delta; i <= currentPage + delta; i++) {
            if (i < totalPages && i > 1) {
                range.push(i);
            }
        }
        range.push(totalPages);

        for (const i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots;
    };

    return (
        <div className="flex items-center justify-center gap-2 mt-12 mb-20">
            <Button
                variant="outline" size="icon" aria-label="Vorherige Seite"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
            >
                <ChevronLeft size={20} className="text-white" />
            </Button>

            <div className="flex items-center gap-2 px-2 select-none">
                {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                        <span key={`dots-${index}`} className="text-zinc-600 px-2">...</span>
                    ) : (
                        <Button
                            variant={currentPage === page ? "default" : "outline"} size="icon"
                            aria-label={`Seite ${page}`} aria-current={currentPage === page ? "page" : undefined}
                            key={index}
                            onClick={() => handlePageChange(Number(page))}
                        >
                            {page}
                        </Button>
                    )
                ))}
            </div>

            <Button
                variant="outline" size="icon" aria-label="Nächste Seite"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
            >
                <ChevronRight size={20} className="text-white" />
            </Button>
        </div>
    );
}
