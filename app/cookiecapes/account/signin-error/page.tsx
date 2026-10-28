import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ToastMessage } from "../../components/ToastMessage";
export default async function SignInErrorPage() {
  const { t } = await getTranslations();
  return <main className="max-w-3xl mx-auto px-6 pt-32 pb-16 text-white">
    <ToastMessage message={t("Sign-in was cancelled or the sign-in service is unavailable. Please try again.")} />
    <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8"><h1 className="font-nexa text-3xl mb-6">{t("Your account is waiting for you.")}</h1>
      <Button asChild size="lg"><Link href="/cookiecapes/account">{t("Go to sign-in")}</Link></Button></div>
  </main>;
}
