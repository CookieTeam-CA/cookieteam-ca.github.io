"use client";

import Link from "next/link";
import { toast } from "@/components/ui/toast";
import { useTranslations } from "../i18n/client";

export function useDuplicateToast() {
  const { t } = useTranslations();
  return (error: unknown): boolean => {
    if (!error || typeof error !== "object") return false;
    const value = error as { code?: unknown; existingCapeId?: unknown };
    if (value.code !== "duplicate_cape" || typeof value.existingCapeId !== "number" || !Number.isSafeInteger(value.existingCapeId) || value.existingCapeId <= 0) return false;
    toast.add({ type: "error", title: t("An identical public cape already exists."), description: <Link className="underline focus-visible:outline-2" href={`/cookiecapes/capes/${value.existingCapeId}`}>{t("View cape #{id}", { id: value.existingCapeId })}</Link> });
    return true;
  };
}
