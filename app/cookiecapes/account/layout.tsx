import { getTranslations } from "@/app/cookiecapes/i18n/server";
import Footer from "@/app/components/Footer";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("Your account"), robots: { index: false, follow: false } };
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getTranslations();
  return <div className="min-h-screen bg-[#080808] text-white">{children}<Footer locale={locale} /></div>;
}
