"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useTranslations } from "@/app/cookiecapes/i18n/client";
import { reviewCosmetic } from "@/app/actions/cosmetic-actions";

export default function ModerationControls({ id, status }: { id: number; status: string }) {
    const { t } = useTranslations();
    const router = useRouter();
    const [current, setCurrent] = useState(status);
    const [pending, startTransition] = useTransition();

    const decide = (approve: boolean) => startTransition(async () => {
        const result = await reviewCosmetic(id, approve);
        if (result.error !== undefined) {
            toast.add({ title: result.error, type: "error" });
            return;
        }
        setCurrent(result.value.status);
        toast.add({ title: approve ? t("Cosmetic approved.") : t("Cosmetic removed."), type: "success" });
        router.refresh();
    });

    return (
        <div className="space-y-3">
            <p className="text-sm text-zinc-400">{t("Status: {status}", { status: current })}</p>
            <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={pending || current === "approved"} onClick={() => decide(true)}><Check size={16} aria-hidden="true" />{t("Approve")}</Button>
                <Button size="sm" variant="destructive" disabled={pending || current === "rejected"} onClick={() => decide(false)}><Trash2 size={16} aria-hidden="true" />{t("Remove")}</Button>
            </div>
        </div>
    );
}
