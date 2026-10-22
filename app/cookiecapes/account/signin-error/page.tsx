import Link from "next/link";
export default function SignInErrorPage() {
  return <main className="min-h-screen max-w-3xl mx-auto px-6 pt-32 text-white">
    <h1 className="text-3xl font-bold mb-4">Ein Fehler ist bei deiner Anmeldung aufgetreten</h1>
    <p className="text-zinc-400 mb-6">Die Anmeldung wurde abgebrochen oder der Anmeldedienst ist gerade nicht verfügbar. Bitte versuche es erneut.</p>
    <Link href="/cookiecapes/account" className="text-orange-400 underline">Erneut versuchen</Link>
  </main>;
}
