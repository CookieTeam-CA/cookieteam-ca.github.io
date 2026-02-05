import Link from "next/link";
import { Download, Edit3, Image as ImageIcon, Save, CheckCircle } from "lucide-react";
import { Metadata } from "next";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
    title: "Tutorial - CookieCapes",
};

export default function TutorialPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-orange-500/5 blur-[120px] -z-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 py-32">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    Cape Erstellen <span className="text-orange-500">Tutorial</span>
                </h1>
                <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                    Lerne Schritt für Schritt, wie du dein eigenes Minecraft Cape designst und hochlädst.
                </p>
            </div>

            <div className="space-y-12">
                <section className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Download className="text-orange-500" />
                        Was du brauchst
                    </h2>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <Edit3 size={18} className="text-blue-400" />
                                Bildbearbeitungsprogramm
                            </h3>
                            <p className="text-zinc-400 mb-4">
                                Wir empfehlen <a href="https://www.getpaint.net/download.html" target="_blank" className="text-orange-400 hover:text-orange-300">Paint.NET</a>. 
                                Es ist kostenlos, einfach und perfekt für Pixel-Art. Alternativ kannst du jedes andere Bildbearbeitungsprogramm nutzen.
                            </p>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <ImageIcon size={18} className="text-purple-400" />
                                Cape Template
                            </h3>
                            <p className="text-zinc-400 mb-6">
                                Lade dir eines unserer Templates herunter, um das richtige Format zu haben.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <a 
                                    href="/template/cape_template.png" 
                                    download="cape_template.png"
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors border border-white/10 flex items-center gap-2"
                                >
                                    <Download/>
                                    Standard Template
                                </a>
                                <a 
                                    href="/template/cape_template_elytra.png" 
                                    download="cape_template_elytra.png"
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors border border-white/10 flex items-center gap-2"
                                >
                                    <Download/>
                                    Elytra Template
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] pointer-events-none" />
                    
                    <h2 className="text-2xl font-bold mb-8">Schritt-für-Schritt Anleitung</h2>

                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-black shrink-0">1</div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Öffnen & Laden</h3>
                                <p className="text-zinc-400">
                                    Starte dein Bildbearbeitungsprogramm (z.B. Paint.NET) und öffne das heruntergeladene Template-Bild.
                                </p>
                            </div>
                        </div>

                         <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-black shrink-0">2</div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Designen</h3>
                                <p className="text-zinc-400">
                                    Male dein Design auf das Template. Du kannst auch andere Bilder über das Template legen, achte nur darauf, dass du das Format nicht veränderst.
                                </p>
                            </div>
                        </div>

                         <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-black shrink-0">3</div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Speichern</h3>
                                <p className="text-zinc-400 mb-3">
                                    Gehe auf <code className="bg-black/30 px-1.5 py-0.5 rounded text-orange-200">Datei {'>'} Speichern unter...</code>
                                </p>
                                <ul className="list-disc list-inside text-zinc-400 ml-2 space-y-1">
                                    <li>Wähle unbedingt <strong>PNG (*.png)</strong> als Dateityp.</li>
                                    <li>Gib dem Cape einen Namen.</li>
                                    <li>Speichere es ab.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 text-orange-200">
                    <h3 className="font-bold flex items-center gap-2 mb-2">
                        <CheckCircle size={20} />
                        Wichtig
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm opacity-90">
                        <li>Du kannst <strong>Transparenz</strong> für coole Effekte nutzen, aber mache das Cape nicht unsichtbar.</li>
                        <li>Halte dich an unsere <Link href="/cookiecapes/rules" className="underline hover:text-white">Regeln</Link>.</li>
                    </ul>
                </div>

                <div className="text-center pt-8">
                     <Link 
                        href="/cookiecapes"
                        className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
                     >
                        Zum Upload
                     </Link>
                </div>
            </div>
        </div>
        <Footer/>
    </main>
  );
}
