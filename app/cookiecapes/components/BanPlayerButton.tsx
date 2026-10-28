"use client";

import { useTranslations } from "@/app/cookiecapes/i18n/client";
import { Button } from "@/components/ui/button";
import { Gavel } from "lucide-react";
import { banPlayer } from "../../actions/player-actions";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface BanPlayerButtonProps {
    minecraftName: string;
    isAdmin: boolean;
    className?: string;
}

export default function BanPlayerButton({ minecraftName, isAdmin, className = "" }: BanPlayerButtonProps) {
  const { t } = useTranslations();
    const [isBanning, setIsBanning] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [reason, setReason] = useState(t("Rule violation"));
    const router = useRouter();
    const pending = useRef(false);

    if (!isAdmin) return null;

    const handleBan = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (pending.current) return;
        pending.current = true;
        setIsBanning(true);
        try {
            const result = await banPlayer(minecraftName, reason);

            if (result.success) {
                router.refresh();
                setShowConfirm(false);
            } else {
                alert(t("Error: {message}", { message: result.error ?? "" }));
                setShowConfirm(false);
            }
        } catch {
            alert(t("The request could not be completed. Please try again later."));
        } finally {
            pending.current = false;
            setIsBanning(false);
        }
    };

    if (showConfirm) {
        return (
            <div
                className={`absolute top-2 left-2 flex flex-col gap-2 bg-red-700 rounded-lg p-2 z-30 shadow-2xl border border-red-400/30 animate-in fade-in zoom-in duration-200 min-w-50 ${className}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <Gavel size={14} className="text-white" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t("Ban player?")}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t("Reason...")}
                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                        autoFocus
                    />

                    <div className="flex justify-end gap-1.5">
                        <Button
                            variant="ghost" size="xs"
                            onClick={() => setShowConfirm(false)}
                            className="text-white/70"
                            title={t("Cancel")}
                        >
                            {t("Cancel")}
                        </Button>
                        <Button
                            variant="secondary" size="xs"
                            onClick={handleBan}
                            disabled={isBanning}
                            className="bg-white text-red-700 hover:bg-zinc-100"
                            title={t("Confirm")}
                        >
                            {isBanning ? <div className="w-3 h-3 border-2 border-red-700/30 border-t-red-700 rounded-full animate-spin mx-auto" /> : t("Confirm")}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Button
            variant="destructive" size="icon-sm"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowConfirm(true);
            }}
            className={`absolute top-2 left-2 z-20 bg-red-500/80 shadow-lg backdrop-blur-sm ${className}`}
            title={t("Ban player (admin)")}
        >
            <Gavel size={16} />
        </Button>
    );
}
