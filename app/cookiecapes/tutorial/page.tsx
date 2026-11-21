import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Download, Edit3, ImagePlus, Move, Upload } from "lucide-react";
import { Metadata } from "next";
import Footer from "../../components/Footer";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Tutorial",
    };
}

export default async function TutorialPage() {
    const { t, locale } = await getTranslations();
    const steps = [
        [ImagePlus, t("Bring a picture"), t("Drop, paste or choose any picture: a photo, artwork, a logo you are allowed to use, or an animated GIF, APNG or WebP.")],
        [Move, t("Choose the part you like"), t("The picture appears on the back of your cape right away. Drag it, zoom in, or show the whole picture. The 3D preview updates as you go.")],
        [Upload, t("Name it and publish"), t("Give your cape a name and publish it. Animations are processed for a moment; you can leave the page open while that happens.")],
    ] as const;
    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-orange-500/5 blur-[120px] -z-10 pointer-events-none" />

            <div className="max-w-4xl mx-auto px-6 py-32">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        {t("Create a cape")} <span className="text-orange-500">Tutorial</span>
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                        {t("All you need is a picture. We build the cape around it.")}
                    </p>
                    <Button asChild size="lg" className="mt-8"><Link href="/cookiecapes/create"><ImagePlus size={18} />{t("Create a cape")}</Link></Button>
                </div>

                <div className="space-y-12">
                    <section className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold mb-8">{t("Three steps")}</h2>
                        <ol className="space-y-8">
                            {steps.map(([Icon, title, text], index) => <li key={title} className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-black shrink-0">{index + 1}</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Icon size={18} className="text-orange-400" aria-hidden="true" />{title}</h3>
                                    <p className="text-zinc-400">{text}</p>
                                </div>
                            </li>)}
                        </ol>
                    </section>

                    <section className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold mb-3">{t("Prefer to draw it yourself?")}</h2>
                        <p className="text-zinc-400 mb-8">{t("You can also paint every pixel. Files drawn on the cape template are recognised and uploaded unchanged.")}</p>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <Edit3 size={18} className="text-blue-400" />
                                    {t("Web editor")}
                                </h3>
                                <p className="text-zinc-400 mb-4">{t("Paint on the template in your browser, then choose “Use this cape” to publish it.")}</p>
                                <Button asChild variant="outline"><Link href="/cookiecapes/editor"><Edit3 size={16} />{t("Open editor")}</Link></Button>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <Download size={18} className="text-purple-400" />
                                    {t("Cape template")}
                                </h3>
                                <p className="text-zinc-400 mb-4">
                                    {t("For an external editor such as")} <a href="https://www.getpaint.net/download.html" target="_blank" rel="noreferrer" className="text-orange-400 underline hover:text-orange-300">Paint.NET</a>{t(", download a template and keep its dimensions. Save as PNG.")}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Button asChild variant="outline"><a href="/template/cape_template.png" download="cape_template.png"><Download size={16} />{t("Standard")}</a></Button>
                                    <Button asChild variant="outline"><a href="/template/cape_template_elytra.png" download="cape_template_elytra.png"><Download size={16} />Elytra</a></Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 text-orange-200">
                        <h3 className="font-bold flex items-center gap-2 mb-2">{t("Important")}</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm opacity-90">
                            <li>{t("PNG, JPG, GIF, APNG or WebP up to 32 MiB. Photos, artwork and animations all work.")}</li>
                            <li>{t("You can use")} <strong>{t("transparency")}</strong> {t("for cool effects, but do not make the cape invisible.")}</li>
                            <li>{t("Follow our")} <Link href="/cookiecapes/rules" className="underline hover:text-white">{t("Rules")}</Link>.</li>
                        </ul>
                    </div>
                </div>
            </div>
            <Footer locale={locale} />
        </main>
    );
}
