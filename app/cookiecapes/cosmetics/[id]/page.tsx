import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowLeft, Calendar, Film, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { websiteSessionCookie } from "@/lib/cookieapi-config";
import { loadModeratedCosmetic } from "@/app/actions/cosmetic-actions";
import { getCosmetic } from "../../lib/api";
import { privateCosmeticUrls } from "../../lib/cosmetic-urls";
import type { CosmeticSummary } from "../../lib/cosmetic-types";
import CapeViewer from "../../components/CapeViewer";
import { PerformanceBadge, SLOT_LABELS } from "../../components/CosmeticCard";
import ModerationControls from "./ModerationControls";
import Footer from "../../../components/Footer";

export const revalidate = 0;

interface PageProps { params: Promise<{ id: string }> }

async function load(id: number): Promise<{ cosmetic: CosmeticSummary | null; moderator: boolean }> {
    const signedIn = !!(await cookies()).get(websiteSessionCookie)?.value;
    // Moderators may open every cosmetic; the API decides who is a moderator.
    const moderated = signedIn ? await loadModeratedCosmetic(id).catch(() => null) : null;
    if (moderated?.value) return { cosmetic: privateCosmeticUrls(moderated.value), moderator: true };
    return { cosmetic: await getCosmetic(id).catch(() => null), moderator: false };
}

export async function generateMetadata({ params }: PageProps) {
    const { t } = await getTranslations();
    const cosmetic = await getCosmetic(Number((await params).id)).catch(() => null);
    return cosmetic
        ? { title: cosmetic.name, description: t("Cosmetic by {name}", { name: cosmetic.owner_name }), openGraph: { images: [cosmetic.preview_url] } }
        : { title: t("Cosmetic not found"), robots: { index: false } };
}

export default async function CosmeticDetailsPage({ params }: PageProps) {
    const { t, locale } = await getTranslations();
    const { cosmetic, moderator } = await load(Number((await params).id));

    if (!cosmetic) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
                <h1 className="text-3xl font-bold mb-4">{t("Cosmetic not found")}</h1>
                <p className="text-zinc-400 mb-8">{t("This cosmetic does not exist, is still being reviewed or has been removed.")}</p>
                <Button asChild size="lg"><Link href="/cookiecapes/cosmetics">{t("Back to cosmetics")}</Link></Button>
            </div>
        );
    }

    const reports = Array.isArray(cosmetic.reports) ? cosmetic.reports : [];
    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                <Link href="/cookiecapes/cosmetics" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    {t("Back to cosmetics")}
                </Link>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden aspect-4/3 relative">
                        <CapeViewer minecraftName={cosmetic.owner_name} cosmetics={[cosmetic]} animation="idle"
                            fallbackSrc={cosmetic.preview_url} fallbackAlt={t("Preview of {name}", { name: cosmetic.name })} />
                    </div>
                    <aside className="space-y-6">
                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 space-y-4">
                            <div>
                                <p className="text-sm text-primary">{t(SLOT_LABELS[cosmetic.slot])}</p>
                                <h1 className="text-3xl font-bold break-words">{cosmetic.name}</h1>
                            </div>
                            <PerformanceBadge rating={cosmetic.performance.rating} score={cosmetic.performance.score} />
                            <dl className="space-y-2 text-sm text-zinc-300">
                                <div className="flex items-center gap-2"><User size={16} aria-hidden="true" /><dt className="sr-only">{t("Creator")}</dt>
                                    <dd><Link className="hover:text-white underline-offset-4 hover:underline" href={`/cookiecapes/players/${cosmetic.owner_uuid}`}>{cosmetic.owner_name}</Link></dd></div>
                                <div className="flex items-center gap-2"><Calendar size={16} aria-hidden="true" /><dt className="sr-only">{t("Created")}</dt>
                                    <dd>{new Date(cosmetic.created_at).toLocaleDateString(locale)}</dd></div>
                                <div className="flex items-center gap-2"><Film size={16} aria-hidden="true" /><dt className="sr-only">{t("Texture")}</dt>
                                    <dd>{t("{width} × {height} px, {frames} frame(s)", { width: cosmetic.texture.width, height: cosmetic.texture.height, frames: cosmetic.texture.frames })}{cosmetic.animated ? ` · ${t("Animated")}` : ""}</dd></div>
                            </dl>
                            <p className="text-sm text-zinc-400">{cosmetic.shareable ? t("Everyone can equip this cosmetic in the mod or in their account.") : t("Only the creator can wear this cosmetic.")}</p>
                        </div>
                        {moderator && (
                            <div className="bg-zinc-900/50 border border-orange-500/30 rounded-2xl p-6 space-y-4">
                                <h2 className="font-semibold">{t("Moderation")}</h2>
                                <ModerationControls id={cosmetic.cosmetic_id} status={cosmetic.status} />
                                {reports.length > 0 && (
                                    <ul className="space-y-2 text-sm text-zinc-300">
                                        {reports.map(report => <li key={report.reporter_uuid + report.created_at} className="rounded-lg bg-white/5 p-2 break-words">{report.reason}</li>)}
                                    </ul>
                                )}
                            </div>
                        )}
                    </aside>
                </div>
            </div>
            <Footer />
        </main>
    );
}
