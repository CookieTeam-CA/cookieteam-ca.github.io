import Link from "next/link";
export default function SetupWizard() {
  return <section className="w-full max-w-2xl mx-auto px-6 py-12 text-center">
    <h2 className="font-nexa text-3xl text-white mb-6">Cape hochladen</h2>
    <p className="text-zinc-400 mb-6">Melde dich mit Discord an, verknüpfe deinen Minecraft-Account und lade dein Cape sicher hoch.</p>
    <Link href="/cookiecapes/account" className="inline-block rounded-lg bg-orange-600 px-6 py-3 text-white">Zum Account und Upload</Link>
    <Link href="/cookiecapes/editor" className="block mt-6 text-orange-400 hover:underline">Cape im Editor gestalten</Link>
  </section>;
}
