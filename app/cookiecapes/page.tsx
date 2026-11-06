import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import CapeHero from "./components/CapeHero";
import SetupWizard from "./components/SetupWizard";
import RandomCapes from "./components/RandomCapes";
import { getRandomCapes } from "./lib/api";
import Footer from "../components/Footer";

import DownloadSection from "./components/DownloadSection";
import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { loadAccount } from "@/app/actions/account-actions";
import type { AccountInfo } from "./lib/account-types";
import { ToastMessage } from "./components/ToastMessage";
import CapeFAQ from "./components/CapeFAQ";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
  title: t("Overview"),
};
}

export const revalidate = 0;

export default async function CookieCapesPage() {
  const { t, locale } = await getTranslations();
  const capes = await getRandomCapes(3);
  let account: AccountInfo | null = null;
  let accountUnavailable = false;
  try {
    const session = await auth();
    if (session?.user) account = await loadAccount();
  } catch { accountUnavailable = true; }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {accountUnavailable && <ToastMessage message={t("Your account details could not be loaded. Please try again later.")} />}
      <CapeHero />

      <Suspense fallback={<div role="status" className="mx-auto w-full max-w-7xl px-6 py-16">
        <span className="sr-only">{t("Loading capes...")}</span>
        <Skeleton className="mb-8 h-10 w-2/3 max-w-sm" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-border bg-card">
            <Skeleton className="aspect-square rounded-none" />
            <div className="flex flex-col gap-3 p-3 sm:p-5"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-5 w-1/2" /><Skeleton className="mt-3 h-4 w-20" /></div>
          </div>)}
        </div>
      </div>}>
        <RandomCapes capes={capes} />
      </Suspense>

      <div id="setup-wizard" className="relative scroll-mt-24 px-6 py-8">
        <div className="relative mx-auto max-w-5xl">{account ? <SetupWizard account={account} /> : <section className="rounded-3xl border border-white/10 bg-[#101010] p-8 text-center sm:p-12">
          <h2 className="font-nexa text-3xl">{t("Your skin. Your cape.")}</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">{accountUnavailable ? t("Open your account to start the upload wizard.") : t("Sign in, link your Minecraft account, and bring your own design into the game.")}</p>
          <Button asChild size="lg" className="mt-6"><Link href="/cookiecapes/account">{accountUnavailable ? t("Go to account") : t("Sign in and upload a cape")}</Link></Button>
        </section>}</div>
      </div>

      <DownloadSection />
      <CapeFAQ />
      <Footer locale={locale} />
    </main>
  );
}
