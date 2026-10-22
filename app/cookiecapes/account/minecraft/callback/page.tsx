import Link from "next/link";
import { completeMinecraftLink } from "@/app/actions/account-actions";
import ProfileSelection from "../../ProfileSelection";
export const dynamic = "force-dynamic";
export default async function MinecraftCallback({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  let result;
  try {
    if (typeof query.code !== "string" || typeof query.state !== "string" || query.error) throw new Error("Linking cancelled");
    result = await completeMinecraftLink(query.code, query.state);
  } catch {
    return <main className="min-h-screen max-w-3xl mx-auto px-6 pt-32 text-white"><h1 className="text-2xl mb-4">Minecraft-Verknüpfung nicht abgeschlossen</h1><p className="mb-4">Die Anfrage ist abgelaufen, wurde abgebrochen oder konnte nicht bestätigt werden. Bitte starte erneut von deinem Account.</p><Link href="/cookiecapes/account" className="text-orange-400 underline">Zum Account</Link></main>;
  }
  return <main className="min-h-screen max-w-3xl mx-auto px-6 pt-32 text-white"><ProfileSelection state={result.state} profiles={result.profiles} /></main>;
}
