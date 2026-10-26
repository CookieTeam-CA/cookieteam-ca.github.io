import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ToastMessage } from "../../components/ToastMessage";
export default function SignInErrorPage() {
  return <main className="max-w-3xl mx-auto px-6 pt-32 pb-16 text-white">
    <ToastMessage message="Die Anmeldung wurde abgebrochen oder der Anmeldedienst ist gerade nicht verfügbar. Bitte versuche es erneut." />
    <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8"><h1 className="font-nexa text-3xl mb-6">Dein Account wartet auf dich.</h1>
      <Button asChild size="lg"><Link href="/cookiecapes/account">Zur Anmeldung</Link></Button></div>
  </main>;
}
