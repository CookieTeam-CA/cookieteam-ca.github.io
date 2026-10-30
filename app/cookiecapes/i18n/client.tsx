"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { translations } from "./messages";
import type { Locale } from "./locale";

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = locale;
    return () => { document.documentElement.lang = previous; };
  }, [locale]);
  return <LocaleContext.Provider value={locale}><div lang={locale}>{children}</div></LocaleContext.Provider>;
}

export function CookieCapesLocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const pathname = usePathname();
  const excluded = pathname?.startsWith("/cookiecapes/admin");
  return <LocaleProvider locale={excluded ? "de" : locale}>{children}</LocaleProvider>;
}

export function useTranslations() {
  const locale = useContext(LocaleContext);
  return useMemo(() => translations(locale), [locale]);
}
