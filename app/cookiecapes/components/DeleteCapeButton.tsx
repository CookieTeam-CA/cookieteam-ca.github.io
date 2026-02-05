"use client";

import { Trash2, AlertCircle, X, Check } from "lucide-react";
import { deleteCape } from "../../actions/cape-actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteCapeButtonProps {
    capeId: number;
    isAdmin: boolean;
}

export default function DeleteCapeButton({ capeId, isAdmin }: DeleteCapeButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    if (!isAdmin) return null;

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsDeleting(true);
        const result = await deleteCape(capeId);
        
        if (result.success) {
            router.refresh();
        } else {
            alert(`Fehler: ${result.error}`);
            setShowConfirm(false);
        }
        setIsDeleting(false);
    };

    if (showConfirm) {
        return (
            <div 
                className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 rounded-lg p-1 z-30 shadow-lg border border-red-400/30 animate-in fade-in zoom-in duration-200"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                <div className="flex items-center gap-2 px-2 py-1">
                    <AlertCircle size={14} className="text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Löschen?</span>
                </div>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setShowConfirm(false)}
                        className="p-1 hover:bg-white/10 rounded transition-colors text-white/70"
                        title="Abbrechen"
                    >
                        <X size={14} />
                    </button>
                    <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-1 bg-white text-red-600 rounded hover:bg-zinc-100 transition-colors"
                        title="Bestätigen"
                    >
                        {isDeleting ? <div className="w-3.5 h-3.5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" /> : <Check size={14} />}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button 
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowConfirm(true);
            }}
            className="absolute top-2 left-2 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-all z-20 backdrop-blur-sm cursor-pointer shadow-lg border border-red-400/20"
            title="Cape löschen (Admin)"
        >
            <Trash2 size={16} />
        </button>
    );
}
