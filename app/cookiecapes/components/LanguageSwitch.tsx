"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "../i18n/client";
import { setLocale } from "../i18n/actions";

export default function LanguageSwitch() {
  const { locale } = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div role="group" aria-label={locale === "de" ? "Sprache" : "Language"} className="flex shrink-0 gap-0.5">
    {(["en", "de"] as const).map(language => <Button key={language} type="button" variant={language === locale ? "secondary" : "ghost"} size="sm"
      lang={language} aria-label={language === "en" ? "Switch to English" : "Auf Deutsch wechseln"} aria-pressed={language === locale} disabled={pending || language === locale}
      onClick={() => {
        startTransition(async () => {
          await setLocale(language);
          router.refresh();
        });
      }}>{language.toUpperCase()}</Button>)}
  </div>;
}
