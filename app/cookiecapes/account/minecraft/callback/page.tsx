import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { completeMinecraftLink } from "@/app/actions/account-actions";
import ProfileSelection from "../../ProfileSelection";
import { ToastMessage } from "../../../components/ToastMessage";
export const dynamic = "force-dynamic";
export default async function MinecraftCallback({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { t } = await getTranslations();
  const query = await searchParams;
  let result;
  try {
    if (typeof query.code !== "string" || typeof query.state !== "string" || query.error) throw new Error("Linking cancelled");
    result = await completeMinecraftLink(query.code, query.state);
  } catch {
    return <main className="max-w-3xl mx-auto px-6 pt-32 pb-16 text-white"><ToastMessage message={t("Minecraft linking expired, was cancelled, or could not be verified. Please start again from your account.")} /><div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8"><h1 className="font-nexa text-3xl mb-4">{t("Back to your account")}</h1><Button asChild size="lg"><Link href="/cookiecapes/account">{t("Go to account")}</Link></Button></div></main>;
  }
  return <main className="max-w-3xl mx-auto px-6 pt-32 pb-16 text-white"><ProfileSelection state={result.state} profiles={result.profiles} /></main>;
}
