import Footer from "@/app/components/Footer";
import Link from "next/link";
import { legalCopy, legalDate } from "./content";

export default async function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  const copy = legalCopy.en;
  return <main lang="en" className="min-h-screen bg-[#050505] text-white px-6 pt-32 pb-12">
    <article className="mx-auto max-w-4xl space-y-8">
      <header><h1 className="font-nexa text-4xl sm:text-5xl">{title}</h1><p className="mt-4 text-sm text-zinc-400">{copy.updated}: <time dateTime={legalDate}>{new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${legalDate}T00:00:00Z`))}</time></p></header>
      {children}
      <nav aria-label="Legal pages" className="flex flex-wrap gap-6 text-sm text-orange-400">
        <Link className="underline underline-offset-4" href="/legal-notice">Legal notice</Link>
        <Link className="underline underline-offset-4" href="/privacy-policy">Privacy policy</Link>
        <Link className="underline underline-offset-4" href="/">Back to home</Link>
      </nav>
    </article>
    <Footer locale="en" showLanguageSwitch={false} />
  </main>;
}
