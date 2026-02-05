import { Suspense } from "react";
import CapeHero from "./components/CapeHero";
import SetupWizard from "./components/SetupWizard";
import RandomCapes from "./components/RandomCapes";
import { getRandomCapes } from "./lib/api";
import Footer from "../components/Footer";

import DownloadSection from "./components/DownloadSection";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Übersicht - CookieCapes",
};

export const revalidate = 60;

export default async function CookieCapesPage() {
  const capes = await getRandomCapes(3);

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <CapeHero/>

      <Suspense fallback={<div className="h-[500px] w-full flex items-center justify-center text-zinc-500">Lade Capes...</div>}>
         <RandomCapes capes={capes} />
      </Suspense>

      <div id="setup-wizard" className="relative py-20">
         <div className="absolute top-0 left-0 w-full h-full bg-orange-500/5 rotate-180 pointer-events-none"/>
          <SetupWizard/>
      </div>

      <DownloadSection/>
      <Footer/>
    </main>
  );
}
