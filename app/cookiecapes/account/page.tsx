import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { Button } from "@/components/ui/button";
import { auth, signIn, signOut } from "@/auth";
import { loadAccount } from "@/app/actions/account-actions";
import { ArrowRight, LogOut, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { Suspense } from "react";
import AccountPanel from "./AccountPanel";
import AccountCapePreview from "./AccountCapePreview";
import { getRandomCapes } from "../lib/api";
import { ToastMessage } from "../components/ToastMessage";
import Link from "next/link";
import { isCookieCapesAdmin } from "@/lib/cookiecapes-admin";

export const dynamic = "force-dynamic";

async function RandomCapePreview() {
  const capes = await getRandomCapes(8).catch(() => []);
  return <AccountCapePreview capes={capes} />;
}

async function AccountRecovery({ message }: { message: string }) {
  const { t } = await getTranslations();
  return <main className="mx-auto max-w-3xl px-6 pb-16 pt-36">
    <ToastMessage message={message} type="error" />
    <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8 sm:p-12">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">{t("CookieCapes account")}</span>
      <h1 className="mt-4 font-nexa text-3xl">{t("Your space is waiting for you.")}</h1>
      <p className="mt-4 leading-relaxed text-zinc-400">{t("Reload the page to access your account. Your capes remain saved.")}</p>
      <form method="get" action="/cookiecapes/account" className="mt-6"><Button size="lg" type="submit">{t("Reload")}</Button></form>
    </div>
  </main>;
}

export default async function AccountPage() {
  const { t } = await getTranslations();
  let session;
  try { session = await auth(); }
  catch { return <AccountRecovery message={t("Your sign-in could not be checked. Please try again.")} />; }

  if (!session?.user) return <main className="relative mx-auto max-w-6xl px-5 pb-10 pt-32 sm:px-8 sm:pt-40">
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900/40">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-orange-500/10 blur-[100px]" />
      <div className="relative grid lg:grid-cols-[1.1fr_1fr]">
        <div className="p-7 sm:p-12 lg:py-16">
          <h1 className="mt-7 font-nexa text-4xl leading-[1.08] tracking-tight sm:text-6xl">{t("One account.")}<br /><span className="text-orange-400">{t("Your capes.")}</span></h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400">{t("Upgrade your Minecraft look. Link your accounts, upload your own capes, and manage your collection in one place.")}</p>
          <form action={async () => { "use server"; await signIn("discord", { redirectTo: "/cookiecapes/account" }); }} className="mt-8">
            <Button type="submit" size="lg" className="w-full gap-3 bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/15 hover:bg-[#4752C4] focus-visible:ring-[#5865F2] sm:w-auto">
              <svg className="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>
              {t("Sign in with Discord")} <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </form>
          <p className="mt-4 text-xs leading-relaxed text-zinc-500">{t("Discord for sign-in. MC-ID for your Minecraft identity.")}</p>
        </div>
        <div className="relative min-h-80 border-t border-white/5 bg-[radial-gradient(ellipse_at_center,#ff7b0017,transparent_70%)] lg:min-h-130 lg:border-l lg:border-t-0">
          <Suspense fallback={<AccountCapePreview capes={[]} />}><RandomCapePreview /></Suspense>
        </div>
      </div>
    </div>
  </main>;

  let account;
  try { account = await loadAccount(); }
  catch { return <AccountRecovery message={t("Your account could not be loaded. Please try again.")} />; }

  return <main className="mx-auto max-w-6xl px-5 pb-10 pt-32 text-white sm:px-8">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div><h1 className="font-nexa text-3xl sm:text-4xl">{t("Hey,")} {account.user.name ?? session.user.name}!</h1><p className="mt-2 text-sm text-zinc-400">{t("Your accounts, your collection, your next cape.")}</p></div>
      <form action={async () => { "use server"; await signOut({ redirectTo: "/cookiecapes/account" }); }}><Button type="submit" variant="destructive" className="hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300"><LogOut size={16} aria-hidden="true" />{t("Sign out")}</Button></form>
    </header>
    {isCookieCapesAdmin(session.user) && <Link prefetch={false} href="/cookiecapes/admin/stats" className="mb-6 inline-block text-sm text-orange-300 underline underline-offset-4">{t("Open admin statistics")}</Link>}
    <AccountPanel account={account} />
  </main>;
}
