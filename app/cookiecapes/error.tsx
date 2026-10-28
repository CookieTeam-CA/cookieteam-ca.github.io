"use client";

import { useTranslations } from "@/app/cookiecapes/i18n/client";
import { Button } from "@/components/ui/button";

export default function CookieCapesError({ reset }: { reset: () => void }) {
  const { t } = useTranslations();
  return <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center" role="alert">
    <h1 className="text-2xl font-bold">{t("The API response could not be loaded.")}</h1>
    <p className="text-zinc-400">{t("Please try again.")}</p>
    <Button size="lg" onClick={reset}>{t("Try again")}</Button>
  </div>;
}
