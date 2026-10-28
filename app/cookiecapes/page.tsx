import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { Button } from "@/components/ui/button";
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
    <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {accountUnavailable && <ToastMessage message={t("Your account details could not be loaded. Please try again later.")} />}
      <CapeHero />

      <Suspense fallback={<div className="h-125 w-full flex items-center justify-center text-zinc-500">{t("Loading capes...")}</div>}>
        <RandomCapes capes={capes} />
      </Suspense>

      <div id="setup-wizard" className="relative px-6 py-20">
        <div className="absolute top-0 left-0 w-full h-full bg-orange-500/5" />
        <div className="relative mx-auto max-w-5xl">{account ? <SetupWizard account={account} /> : <section className="rounded-3xl border border-white/10 bg-[#101010] p-8 text-center sm:p-12">
          <h2 className="font-nexa text-3xl">{t("Your skin. Your cape.")}</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">{accountUnavailable ? t("Open your account to start the upload wizard.") : t("Sign in, link your Minecraft account, and bring your own design into the game.")}</p>
          <Button asChild size="lg" className="mt-6"><Link href="/cookiecapes/account">{accountUnavailable ? t("Go to account") : t("Sign in and upload a cape")}</Link></Button>
        </section>}</div>
      </div>

      <DownloadSection />
      <Footer locale={locale} />
    </main>
  );
}
