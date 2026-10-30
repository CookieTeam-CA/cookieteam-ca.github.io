import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Download, Edit3, Image as ImageIcon, Save, CheckCircle } from "lucide-react";
import { Metadata } from "next";
import Footer from "../../components/Footer";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Tutorial",
    };
}

export default async function TutorialPage() {
    const { t, locale } = await getTranslations();
    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-orange-500/5 blur-[120px] -z-10 pointer-events-none" />

            <div className="max-w-4xl mx-auto px-6 py-32">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        {t("Create a cape")} <span className="text-orange-500">Tutorial</span>
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                        {t("Learn how to design your own Minecraft cape, step by step.")}
                    </p>
                </div>

                <div className="space-y-12">
                    <section className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <Download className="text-orange-500" />
                            {t("What you need")}
                        </h2>

                        <div className="mb-8 bg-linear-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6">
                            <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                        <span className="bg-orange-500 text-black text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">{t("New")}</span>
                                        {t("Web editor")}
                                    </h3>
                                    <p className="text-zinc-300">
                                        {t("Use our experimental web editor to create capes directly in your browser.")}
                                    </p>
                                </div>
                                <Button asChild size="lg"><Link
                                    href="/cookiecapes/editor"
                                >
                                    <Edit3 size={18} />
                                    {t("Open editor")}
                                </Link></Button>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <Edit3 size={18} className="text-blue-400" />
                                    {t("Image editor")}
                                </h3>
                                <p className="text-zinc-400 mb-4">
                                    {t("We recommend")} <a href="https://www.getpaint.net/download.html" target="_blank" className="text-orange-400 underline hover:text-orange-300">Paint.NET</a>{t(". It is free, simple, and perfect for pixel art.")}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <ImageIcon size={18} className="text-purple-400" />
                                    {t("Cape template")}
                                </h3>
                                <p className="text-zinc-400 mb-6">
                                    {t("If you use an external editor, download one of our templates:")}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Button asChild size="lg" variant="outline" className="w-40"><a
                                        href="/template/cape_template.png"
                                        download="cape_template.png"
                                    >
                                        <Download size={16} />
                                        {t("Standard")}
                                    </a></Button>
                                    <Button asChild size="lg" variant="outline" className="w-40"><a
                                        href="/template/cape_template_elytra.png"
                                        download="cape_template_elytra.png"
                                    >
                                        <Download size={16} />
                                        Elytra
                                    </a></Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                        <h2 className="text-2xl font-bold mb-8">{t("Step-by-step guide")}</h2>

                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-black shrink-0">1</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">{t("Open and load")}</h3>
                                    <p className="text-zinc-400">
                                        {t("Start your image editor (such as Paint.NET) and open the downloaded template.")}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-black shrink-0">2</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">{t("Design")}</h3>
                                    <p className="text-zinc-400">
                                        {t("Draw your design on the template. You can also place other images on it; just keep the original dimensions.")}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-black shrink-0">3</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">{t("Save")}</h3>
                                    <p className="text-zinc-400 mb-3">
                                        {t("Go to")} <code className="bg-black/30 px-1.5 py-0.5 rounded text-orange-200">{t("File")} {'>'} {t("Save as...")}</code>
                                    </p>
                                    <ul className="list-disc list-inside text-zinc-400 ml-2 space-y-1">
                                        <li>{t("Always choose")} <strong>PNG (*.png)</strong> {t("as the file type.")}</li>
                                        <li>{t("Maximum 3 MiB and 4096 × 4096 pixels; a single image only, no animation.")}</li>
                                        <li>{t("Give the cape a name.")}</li>
                                        <li>{t("Save your file.")}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 text-orange-200">
                        <h3 className="font-bold flex items-center gap-2 mb-2">
                            {t("Important")}
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-sm opacity-90">
                            <li>{t("You can use")} <strong>{t("transparency")}</strong> {t("for cool effects, but do not make the cape invisible.")}</li>
                            <li>{t("Follow our")} <Link href="/cookiecapes/rules" className="underline hover:text-white">{t("Rules")}</Link>.</li>
                        </ul>
                    </div>

                    <div className="text-center pt-8">
                        <Button asChild size="lg" variant="secondary" className="rounded-full"><Link
                            href="/cookiecapes"
                        >
                            {t("Go to upload")}
                        </Link></Button>
                    </div>
                </div>
            </div>
            <Footer locale={locale} />
        </main>
    );
}
