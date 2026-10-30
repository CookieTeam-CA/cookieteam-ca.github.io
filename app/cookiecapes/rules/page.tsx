import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import Footer from "../../components/Footer";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
    title: t("Rules"),
};
}

export default async function CookieCapesRules() {
  const { t, locale } = await getTranslations();
    return (
        <main className="min-h-screen bg-[#050505] text-white py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="font-nexa text-4xl md:text-6xl mb-12 text-center">
                    Cookie<span className="text-orange-500">Capes</span> {t("Rules")}
                </h1>

                <div className="space-y-12 text-zinc-300">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white border-l-4 border-orange-500 pl-4">{t("General")}</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>{t("By using the mod, you agree to the following rules.")}</li>
                            <li>{t("The mod is a community project and is not affiliated with Mojang.")}</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white border-l-4 border-red-500 pl-4">{t("Content and restrictions")}</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong className="text-red-400">NSFW</strong> {t("(pornographic or sexually suggestive content) is strictly prohibited.")}</li>
                            <li>{t("Glorification of violence, hate symbols, and political propaganda are prohibited.")}</li>
                            <li>{t("Advertising or third-party logos without permission are not allowed.")}</li>
                            <li>{t("Do not put personal information (such as names or phone numbers) on capes.")}</li>
                            <li>{t("Deepfakes, offensive text, and memes with harmful context are prohibited.")}</li>
                            <li>{t("No racism or discrimination of any kind.")}</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white border-l-4 border-yellow-500 pl-4">{t("Moderation")}</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>{t("Our moderators may remove capes at any time without warning.")}</li>
                            <li>{t("Users who repeatedly break the rules may be banned temporarily or permanently.")}</li>
                            <li>{t("Broken or inappropriate capes will be removed or modified.")}</li>
                            <li><strong>{t("Takedown request:")}</strong> {t("If you see capes that break our rules or use your artwork,")} <a href="mailto:support@cookieattack.de" className="text-orange-500 underline">{t("contact us")}</a>{t(". We will respond promptly when evidence is provided.")}</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white border-l-4 border-blue-500 pl-4">{t("Usage rights")}</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>{t("The mod may only be used privately and noncommercially.")}</li>
                            <li>{t("Selling, paywalls, or donation schemes directly related to the mod are prohibited.")}</li>
                            <li>{t("Code and assets may not be copied, modified, or redistributed without permission.")}</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white border-l-4 border-green-500 pl-4">{t("Privacy policy")}</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>{locale === "de" ? "Für Anmeldung, Minecraft-Verknüpfung und Cape-Verwaltung verarbeiten wir Account- und Profildaten. Externe Dienste liefern unter anderem Skins und Profilverläufe." : "We process account and profile data for sign-in, Minecraft linking, and cape management. External services provide skins and profile history."}</li>
                            <li>{locale === "de" ? "Die Website nutzt Betterlytics für Nutzungsstatistiken und Web Vitals. Einzelheiten zu Daten, Cookies und deinen Rechten findest du in unserer " : "The website uses Betterlytics for usage statistics and web vitals. Read about data, cookies, and your rights in our "}<a className="text-orange-400 underline" href="/privacy-policy">{t("Privacy policy")}</a>.</li>
                        </ul>
                    </section>
                </div>

                <div className="mt-20 text-center">
                    <Button asChild size="lg" className="rounded-full"><a href="/cookiecapes">
                        {t("Back to CookieCapes")}
                    </a></Button>
                </div>
            </div>
            <Footer locale={locale} />
        </main>
    );
}
