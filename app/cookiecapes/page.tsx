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

export const metadata: Metadata = {
  title: "Übersicht - CookieCapes",
};

export const revalidate = 0;

export default async function CookieCapesPage() {
  const capes = await getRandomCapes(3);
  let account: AccountInfo | null = null;
  let accountUnavailable = false;
  try {
    const session = await auth();
    if (session?.user) account = await loadAccount();
  } catch { accountUnavailable = true; }

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {accountUnavailable && <ToastMessage message="Deine Account-Daten konnten nicht geladen werden. Bitte versuche es später erneut." />}
      <CapeHero />

      <Suspense fallback={<div className="h-125 w-full flex items-center justify-center text-zinc-500">Lade Capes...</div>}>
        <RandomCapes capes={capes} />
      </Suspense>

      <div id="setup-wizard" className="relative px-6 py-20">
        <div className="absolute top-0 left-0 w-full h-full bg-orange-500/5 rotate-180 pointer-events-none" />
        <div className="relative mx-auto max-w-5xl">{account ? <SetupWizard account={account} /> : <section className="rounded-3xl border border-white/10 bg-[#101010] p-8 text-center sm:p-12">
          <h2 className="font-nexa text-3xl">Dein Skin. Dein Cape.</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">{accountUnavailable ? "Öffne deinen Account, um den Upload-Assistenten zu starten." : "Melde dich an, verknüpfe deinen Minecraft-Account und bring dein eigenes Design ins Spiel."}</p>
          <Button asChild size="lg" className="mt-6"><Link href="/cookiecapes/account">{accountUnavailable ? "Zum Account" : "Anmelden und Cape hochladen"}</Link></Button>
        </section>}</div>
      </div>

      <DownloadSection />
      <Footer />
    </main>
  );
}
