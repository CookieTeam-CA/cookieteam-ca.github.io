import { loadAccount } from "@/app/actions/account-actions";
import Link from "next/link";
import FrameComposer from "./FrameComposer";

export default async function AnimatePage() {
  let account;
  try { account = await loadAccount(); }
  catch { return <main className="mx-auto max-w-3xl px-6 py-24"><h1 className="font-nexa text-4xl">Animierte Capes</h1><p className="mt-6">Bitte melde dich an und verknüpfe dein Minecraft-Konto.</p><Link href="/cookiecapes/account" className="mt-6 inline-block text-orange-300 underline">Zum Konto</Link></main>; }
  return <FrameComposer links={account.links} />;
}
