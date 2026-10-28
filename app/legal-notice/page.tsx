import LegalPage from "@/app/cookiecapes/legal/LegalPage";
import { operator } from "@/app/cookiecapes/legal/content";

export const metadata = { title: "Legal notice", alternates: { canonical: "/legal-notice" } };

export default function LegalNoticePage() {
  return <LegalPage title="Legal notice">
    <section className="space-y-4 text-zinc-300">
      <h2 className="text-2xl font-bold text-white">Provider under section 18(1) MStV</h2>
      <a className="text-orange-400 underline underline-offset-4" href={`mailto:${operator.email}`}>{operator.email}</a>
      <p>CookieAttack, including CookieCapes, is a noncommercial community project without advertisements or revenue. No company form, commercial registration, or VAT ID is claimed.</p>
    </section>
    <section className="space-y-4 text-zinc-300"><h2 className="text-2xl font-bold text-white">Minecraft</h2><p>Not an official Minecraft service. Not approved by or associated with Mojang or Microsoft.</p></section>
  </LegalPage>;
}
