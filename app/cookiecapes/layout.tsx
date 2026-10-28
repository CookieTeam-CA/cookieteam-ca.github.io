import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { auth } from "@/auth";
import { loadAccount } from "@/app/actions/account-actions";
import CookieNavbar from "./components/CookieNavbar";
import { Toaster } from "@/components/ui/toast";
import { CookieCapesLocaleProvider } from "./i18n/client";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getTranslations();
  const description = locale === "de" ? "Entdecke Minecraft-Capes aus der Community und lade dein eigenes Design hoch." : "Discover community Minecraft capes and upload your own design.";
  return {
    title: { default: "CookieCapes", template: "%s | CookieCapes" },
    description,
    keywords: ["Minecraft", "Capes", "CookieCapes"],
    alternates: { canonical: null },
    openGraph: { title: "CookieCapes", description, locale: locale === "de" ? "de_DE" : "en_GB", url: "/cookiecapes" },
    twitter: { card: "summary_large_image", title: "CookieCapes", description },
  };
}

export default async function CookieCapesLayout({ children }: { children: React.ReactNode }) {
  const { t, locale } = await getTranslations();
  let identity: { name: string; image?: string | null; minecraftUuid?: string } | null = null;
  try {
    const session = await auth();
    if (session?.user) {
      identity = { name: session.user.name ?? t("Your account"), image: session.user.image };
      try {
        const account = await loadAccount();
        const minecraft = account.links[0];
        if (minecraft) identity = { name: minecraft.minecraft_name, minecraftUuid: minecraft.minecraft_uuid };
      } catch { /* Discord identity remains available while Minecraft links cannot be loaded. */ }
    }
  } catch { /* Public pages remain accessible if the session service is unavailable. */ }

  return <CookieCapesLocaleProvider locale={locale}><Toaster closeLabel={t("Close notification")}><CookieNavbar identity={identity} />{children}</Toaster></CookieCapesLocaleProvider>;
}
