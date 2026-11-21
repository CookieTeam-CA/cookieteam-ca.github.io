import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { loadAccount } from "@/app/actions/account-actions";
import CapeCreator from "../components/CapeCreator";
import { ToastMessage } from "../components/ToastMessage";
import Footer from "../../components/Footer";
import type { AccountInfo } from "../lib/account-types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Create a cape"), description: t("Drop a picture or a GIF, choose the part you like, and publish. We build the cape around it.") };
}

export default async function CreateCapePage() {
  const { t, locale } = await getTranslations();
  let account: AccountInfo | null = null;
  let unavailable = false;
  try {
    const session = await auth();
    if (session?.user) account = await loadAccount();
  } catch { unavailable = true; }

  return <main className="min-h-screen bg-background text-foreground">
    {unavailable && <ToastMessage message={t("Your account details could not be loaded. Please try again later.")} />}
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-32 sm:px-6">
      {account ? <CapeCreator account={account} /> : <section className="rounded-3xl border border-white/10 bg-[#101010] p-8 text-center sm:p-12">
        <h1 className="font-nexa text-3xl sm:text-4xl">{t("Turn any picture into a cape")}</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">{t("Sign in, link your Minecraft account, and bring your own design into the game.")}</p>
        <Button asChild size="lg" className="mt-6"><Link href="/cookiecapes/account">{unavailable ? t("Go to account") : t("Sign in and upload a cape")}</Link></Button>
      </section>}
    </div>
    <Footer locale={locale} />
  </main>;
}
