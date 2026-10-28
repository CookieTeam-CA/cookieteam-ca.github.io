"use client";
import { useTranslations } from "@/app/cookiecapes/i18n/client";
import { BadgeCheck } from "lucide-react";
import type { CapeVerification } from "../lib/api";
export default function VerificationBadge({ verification }: { verification?: CapeVerification }) {
  const { t } = useTranslations();
  if (verification !== "website" && verification !== "minecraft_session") return null;
  const text = verification === "website"
    ? t("Uploaded or claimed through a linked Minecraft account. Identity verified; this does not verify authorship of the design.")
    : t("Uploaded through an authenticated Minecraft session. Identity verified; this does not verify authorship of the design.");
  return <span title={text} aria-label={text} role="img" className={`inline-flex align-middle ${verification === "website" ? "text-blue-400" : "text-orange-400"}`}><BadgeCheck size={20} aria-hidden="true" /></span>;
}
