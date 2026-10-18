import Link from "next/link";

export default function SetupWizard() {
  return (
    <section className="w-full max-w-2xl mx-auto px-6 py-12 text-center" aria-labelledby="cape-upload-title">
      <h2 id="cape-upload-title" className="font-nexa text-3xl text-white mb-6">Cape hochladen</h2>
      <p id="cape-upload-unavailable" className="text-zinc-400 mb-6">
        Der Cape-Upload ist vorrübergehend deaktiviert
      </p>
      <button disabled aria-describedby="cape-upload-unavailable" className="rounded-lg bg-zinc-800 px-6 py-3 text-zinc-400 cursor-not-allowed">
        Upload derzeit nicht verfügbar
      </button>
      <Link href="/cookiecapes/editor" className="block mt-6 text-orange-400 hover:underline">Cape im Editor gestalten</Link>
    </section>
  );
}
