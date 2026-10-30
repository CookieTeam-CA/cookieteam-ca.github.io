import { getTranslations } from "../i18n/server";
import Footer from "../../components/Footer";
import GalleryControls from "./GalleryControls";
import PlayerGalleryControls from "./PlayerGalleryControls";

export default async function GalleryLoading({ players = false }: { players?: boolean }) {
    const { t, locale } = await getTranslations();
    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                <div className="text-center mb-16">
                    <h1 className="font-nexa text-4xl md:text-6xl mb-4">
                        {players ? t("Our") : t("Discover")} <span className="text-orange-500">{players ? t("Players") : "Capes"}</span>
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mx-auto">
                        {players ? t("Find other players, view their capes, or browse the list.") : t("Browse the community gallery. Find your favourite cape or get inspired.")}
                    </p>
                </div>
                {players ? <PlayerGalleryControls /> : <GalleryControls />}
                {players && <div aria-busy="true" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }, (_, index) => (
                        <div key={index} className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
                            <div className="w-full aspect-3/4 bg-[#1a1a1a]" />
                            <div className="p-4 flex flex-col items-center bg-zinc-950/50 h-[117px]">
                                <div className="h-6 w-3/4 rounded bg-zinc-800 mb-2" />
                                <div className="h-5 w-1/2 rounded bg-zinc-800" />
                                <div className="border-t border-white/5 w-full pt-3 mt-auto flex justify-center">
                                    <div className="h-4 w-24 rounded bg-zinc-800" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>}
                <div className="min-h-24" />
            </div>
            <Footer locale={locale} />
        </main>
    );
}
