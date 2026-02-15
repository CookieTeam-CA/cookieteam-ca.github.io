import { Metadata } from "next";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
    title: "Regeln - CookieCapes",
};

export default function CookieCapesRules() {
  return (
    <main className="min-h-screen bg-[#050505] text-white py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-nexa text-4xl md:text-6xl mb-12 text-center">
            Cookie<span className="text-orange-500">Capes</span> Regeln
        </h1>

        <div className="space-y-12 text-zinc-300">
            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white border-l-4 border-orange-500 pl-4">Allgemeines</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Durch die Nutzung der Mod stimmst du allen folgenden Regeln automatisch zu.</li>
                    <li>Die Mod hat keinen Bezug zu Mojang, sondern ist ein rein Community Projekt.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white border-l-4 border-red-500 pl-4">Inhalte und Verbote</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong className="text-red-400">NSFW</strong> (pornografisch, sexuell anzüglich) ist strengstens verboten.</li>
                    <li>Gewaltverherrlichung, Hasssymbole oder politische Propaganda sind untersagt.</li>
                    <li>Werbung oder Logos von Drittanbietern ohne Erlaubnis sind nicht gestattet.</li>
                    <li>Keine persönlichen Daten (z.B. Namen, Telefonnummern) auf Capes.</li>
                    <li>Deepfakes, beleidigende Texte oder Memes mit problematischem Kontext sind verboten.</li>
                    <li>Kein Rassismus oder Diskriminierung jeglicher Art.</li>
                </ul>
            </section>

             <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white border-l-4 border-yellow-500 pl-4">Moderation</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Capes können jederzeit ohne Warnung von unseren Moderatoren entfernt werden.</li>
                    <li>Nutzer, die mehrfach gegen die Regeln verstoßen, können temporär oder permanent gesperrt werden.</li>
                    <li>Fehlerhafte oder unpassende Capes werden entfernt oder verändert.</li>
                    <li><strong>Takedown request:</strong> Solltest du Capes sehen, die gegen unsere Regeln verstoßen oder dein Artwork beinhalten, <a href="mailto:support@cookieattack.de" className="text-orange-500 hover:underline">melde dich bei uns</a>. Bei Beweislage werden wir umgehend reagieren.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white border-l-4 border-blue-500 pl-4">Nutzungsrechte</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Die Mod darf nur privat und nicht-kommerziell genutzt werden.</li>
                    <li>Verkauf, Paywall oder Spendenmodelle im direkten Zusammenhang mit der Mod sind untersagt.</li>
                    <li>Code & Assets dürfen nicht ohne Genehmigung kopiert, verändert oder weiterveröffentlicht werden.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white border-l-4 border-green-500 pl-4">Datenschutz</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Wir speichern keine persönlichen Informationen über die reine Mod-Funktionalität (UUID, Cape-Zuweisung) hinaus.</li>
                    <li>Kein Tracking, keine Weitergabe von Daten an unbeteiligte Dritte.</li>
                </ul>
            </section>
        </div>
        
        <div className="mt-20 text-center">
            <a href="/cookiecapes" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-all">
                Zurück zu CookieCapes
            </a>
        </div>
      </div>
      <Footer/>
    </main>
  );
}
