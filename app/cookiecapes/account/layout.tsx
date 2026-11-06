import { getTranslations } from "@/app/cookiecapes/i18n/server";
import "./account.css";
import Footer from "@/app/components/Footer";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("Your account"), robots: { index: false, follow: false } };
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getTranslations();
  return <div className="account-shell min-h-screen bg-background text-foreground">{children}<Footer locale={locale} /></div>;
}
