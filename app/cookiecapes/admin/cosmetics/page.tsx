import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { websiteSessionCookie } from "@/lib/cookieapi-config";
import { loadModerationQueue } from "@/app/actions/cosmetic-actions";
import { privateCosmeticUrls } from "../../lib/cosmetic-urls";
import CosmeticCard from "../../components/CosmeticCard";
import ModerationControls from "../../cosmetics/[id]/ModerationControls";
import Footer from "@/app/components/Footer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cosmetic-Moderation · CookieCapes", robots: { index: false, follow: false } };

const STATUSES = ["pending", "approved", "rejected", "all"] as const;
type Status = (typeof STATUSES)[number];

export default async function CosmeticModerationPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const { t } = await getTranslations();
    const requested = (await searchParams).status;
    const status: Status = STATUSES.includes(requested as Status) ? requested as Status : "pending";
    const signedIn = !!(await cookies()).get(websiteSessionCookie)?.value;
    // The API's moderator allowlist decides access; the page only renders its answer.
    const result = signedIn ? await loadModerationQueue(status) : null;
    const labels: Record<Status, string> = { pending: t("In review"), approved: t("Approved"), rejected: t("Rejected"), all: t("All") };

    return (
        <>
            <main className="min-h-screen bg-background text-foreground">
                <div className="max-w-7xl mx-auto px-6 pt-36 pb-20">
                    <h1 className="font-nexa text-4xl mb-6">{t("Cosmetic moderation")}</h1>
                    {!result?.value ? (
                        <p role="alert" className="text-zinc-400">{signedIn ? result?.error ?? t("Moderator access required.") : t("Please sign in.")}</p>
                    ) : (
                        <>
                            <nav className="mb-8 flex flex-wrap gap-2" aria-label={t("Filter by status")}>
                                {STATUSES.map(value => (
                                    <Link key={value} href={`/cookiecapes/admin/cosmetics?status=${value}`} aria-current={status === value ? "page" : undefined}
                                        className={`rounded-full border px-3 py-1.5 text-sm ${status === value ? "border-primary bg-primary/15 text-white" : "border-white/10 text-zinc-400 hover:text-white"}`}>{labels[value]}</Link>
                                ))}
                            </nav>
                            {result.value.cosmetics.length === 0 ? <p className="text-zinc-400">{t("Nothing to review.")}</p> : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {result.value.cosmetics.map(cosmetic => (
                                        <CosmeticCard key={cosmetic.cosmetic_id} cosmetic={privateCosmeticUrls(cosmetic)}>
                                            {typeof cosmetic.reports === "number" && cosmetic.reports > 0 && <p className="text-xs text-red-300">{t("{count} reports", { count: cosmetic.reports })}</p>}
                                            <div className="mt-2"><ModerationControls id={cosmetic.cosmetic_id} status={cosmetic.status} /></div>
                                        </CosmeticCard>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
