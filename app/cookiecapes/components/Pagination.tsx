"use client";

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

        for (let i of range) {
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
            <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg bg-zinc-900 border border-white/10 hover:border-orange-500/50 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronLeft size={20} className="text-white" />
            </button>

            <div className="flex items-center gap-2 px-2">
                {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                        <span key={`dots-${index}`} className="text-zinc-600 px-2">...</span>
                    ) : (
                        <button
                            key={index}
                            onClick={() => handlePageChange(Number(page))}
                            className={`min-w-[40px] h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                                currentPage === page 
                                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                                    : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30"
                            }`}
                        >
                            {page}
                        </button>
                    )
                ))}
            </div>

            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg bg-zinc-900 border border-white/10 hover:border-orange-500/50 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronRight size={20} className="text-white" />
            </button>
        </div>
    );
}
