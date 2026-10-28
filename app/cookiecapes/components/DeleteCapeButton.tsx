"use client";

import { useTranslations } from "@/app/cookiecapes/i18n/client";
import { Button } from "@/components/ui/button";
import { Trash2, AlertCircle, X, Check } from "lucide-react";
import { deleteCape } from "../../actions/cape-actions";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteCapeButtonProps {
    capeId: number;
    isAdmin: boolean;
}

export default function DeleteCapeButton({ capeId, isAdmin }: DeleteCapeButtonProps) {
  const { t } = useTranslations();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();
    const pending = useRef(false);

    if (!isAdmin) return null;

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (pending.current) return;
        pending.current = true;
        setIsDeleting(true);
        try {
            const result = await deleteCape(capeId);

            if (result.success) {
                router.refresh();
            } else {
                alert(t("Error: {message}", { message: result.error ?? "" }));
                setShowConfirm(false);
            }
        } catch {
            alert(t("The request could not be completed. Please try again later."));
        } finally {
            pending.current = false;
            setIsDeleting(false);
        }
    };

    if (showConfirm) {
        return (
            <div
                className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 rounded-lg p-1 z-30 shadow-lg border border-red-400/30 animate-in fade-in zoom-in duration-200"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                <div className="flex items-center gap-2 px-2 py-1">
                    <AlertCircle size={14} className="text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t("Delete?")}</span>
                </div>
                <div className="flex gap-1">
                    <Button
                        variant="ghost" size="icon-xs"
                        onClick={() => setShowConfirm(false)}
                        className="text-white/70"
                        title={t("Cancel")}
                    >
                        <X size={14} />
                    </Button>
                    <Button
                        variant="secondary" size="icon-xs"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-white text-red-600 hover:bg-zinc-100"
                        title={t("Confirm")}
                    >
                        {isDeleting ? <div className="w-3.5 h-3.5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" /> : <Check size={14} />}
                    </Button>
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
            className="absolute top-2 left-2 z-20 bg-red-500/80 shadow-lg backdrop-blur-sm"
            title={t("Delete cape (admin)")}
        >
            <Trash2 size={16} />
        </Button>
    );
}
