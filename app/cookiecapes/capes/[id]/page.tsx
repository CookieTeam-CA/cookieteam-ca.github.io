import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { Button } from "@/components/ui/button";
import VerificationBadge from "../../components/VerificationBadge";
import { getCapeForDetails as getCape } from "../../lib/cape-details";
import { getPlayersByCape } from "../../lib/api";
import CapeViewer from "../../components/CapeViewer";
import Pagination from "../../components/Pagination";
import Link from "next/link";
import { ArrowLeft, User, Calendar, Hash, Users } from "lucide-react";
import Footer from "../../../components/Footer";

export const revalidate = 0;

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ page?: string | string[] }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { t } = await getTranslations();
    const { id } = await params;
    const cape = await getCape(Number(id));

    if (!cape) {
        return {
            title: t("Cape not found"),
        };
    }

    return {
        title: cape.cape_name,
        ...(cape.is_private ? { robots: { index: false, follow: false } } : {}),
        description: t('View the cape "{cape}" by {name}.', { cape: cape.cape_name, name: cape.minecraft_name }),
    };
}

export default async function CapeDetailsPage({ params, searchParams }: PageProps) {
  const { t, locale } = await getTranslations();
    const { id } = await params;
    const capeId = Number(id);

    const cape = await getCape(capeId);

    if (!cape) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
                <h1 className="text-3xl font-bold mb-4">{t("Cape not found")}</h1>
                <p className="text-zinc-400 mb-8">{t("This cape does not exist or has been deleted.")}</p>
                <Button asChild size="lg"><Link href="/cookiecapes/capes">
                    {t("Back to gallery")}
                </Link></Button>
            </div>
        );
    }

    const query = await searchParams;
    const requestedPage = typeof query.page === "string" ? Number(query.page) : 1;
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const { players, total_count, limit } = await getPlayersByCape(capeId, page);
    const capeUrl = cape.cape_image_url;

    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">

                <Link href="/cookiecapes/capes" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    {t("Back to gallery")}
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden aspect-4/3 relative group">
                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent pointer-events-none z-10" />
                            <div className="w-full h-full flex items-center justify-center">
                                <CapeViewer
                                    allowElytraSwitch
                                    capeUrl={capeUrl}
                                    minecraftName={cape.minecraft_name}
                                    animation="walk"
                                />
                            </div>
                            <div className="absolute bottom-0 left-0 p-6 pr-36 z-20 w-full pointer-events-none">
                                <h1 className="text-3xl md:text-5xl font-nexa text-white mb-2">{cape.cape_name} <VerificationBadge verification={cape.verification} /></h1>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={`https://minotar.net/helm/${cape.minecraft_name}/32`}
                                        alt={cape.minecraft_name}
                                        className="w-8 h-8 rounded"
                                    />
                                    <div className="text-zinc-300">
                                        {t("Uploaded by")} <span className="text-white font-bold">{cape.minecraft_name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                <Hash className="text-orange-500 mb-2" size={20} />
                                <span className="text-zinc-400 text-xs uppercase tracking-wider mb-1">ID</span>
                                <span className="text-xl font-mono font-bold">{cape.cape_id}</span>
                            </div>
                            <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                <Users className="text-orange-500 mb-2" size={20} />
                                <span className="text-zinc-400 text-xs uppercase tracking-wider mb-1">{t("Users")}</span>
                                <span className="text-xl font-bold">{total_count}</span>
                            </div>
                            <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                <Calendar className="text-orange-500 mb-2" size={20} />
                                <span className="text-zinc-400 text-xs uppercase tracking-wider mb-1">{t("Last updated")}</span>
                                <span className="text-sm font-medium">{new Date(cape.last_edited).toLocaleDateString(locale)}</span>
                            </div>
                            <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                <User className="text-orange-500 mb-2" size={20} />
                                <span className="text-zinc-400 text-xs uppercase tracking-wider mb-1">{t("Author")}</span>
                                <span className="text-sm font-medium truncate w-full">{cape.minecraft_name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 h-full flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Users className="text-orange-500" size={20} />
                                {t("Active users")}
                                <span className="bg-orange-500/10 text-orange-400 text-xs px-2 py-1 rounded-full ml-auto font-mono">
                                    {total_count}
                                </span>
                            </h3>

                            {players.length > 0 ? (
                                <div className="flex flex-col gap-3 overflow-y-auto max-h-150 pr-2 custom-scrollbar">
                                    {players.map((player) => (
                                        <div key={player.minecraft_uuid} className="bg-black/30 border border-white/5 rounded-lg p-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                                            <img
                                                src={`https://minotar.net/helm/${player.minecraft_name}/32`}
                                                alt={player.minecraft_name}
                                                className="w-8 h-8 rounded"
                                            />
                                            <span className="font-medium text-zinc-200">{player.minecraft_name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                                    <Users size={48} className="opacity-20 mb-4" />
                                    <p>{t(total_count === 0 ? "Nobody is wearing this cape right now." : "No players found.")}</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
                <Pagination currentPage={page} totalCount={total_count} limit={limit} />
            </div>
            <Footer locale={locale} />
        </main>
    );
}
