import LegalPage from "@/app/cookiecapes/legal/LegalPage";
import { legalCopy } from "@/app/cookiecapes/legal/content";

export const metadata = { title: "Privacy policy", alternates: { canonical: "/privacy-policy" } };

export default function PrivacyPolicyPage() {
  const copy = legalCopy.en;
  return <LegalPage title="Privacy policy">
    <section aria-labelledby="data-summary" className="space-y-4">
      <h2 id="data-summary" className="text-2xl font-bold">{copy.summary}</h2>
      <div role="region" aria-label={copy.summary} tabIndex={0} className="overflow-x-auto rounded-xl border border-white/10 focus-visible:outline-2 focus-visible:outline-orange-400">
        <table className="w-full min-w-180 text-left text-sm"><thead><tr>{copy.columns.map(column => <th scope="col" key={column} className="border-b border-white/10 bg-white/5 p-4 align-top">{column}</th>)}</tr></thead><tbody>{copy.rows.map(row => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th scope="row" key={index} className="border-b border-white/5 p-4 align-top font-medium">{cell}</th> : <td key={index} className="border-b border-white/5 p-4 align-top text-zinc-400">{cell}</td>)}</tr>)}</tbody></table>
      </div>
    </section>
    {copy.sections.map(section => <section key={section.title} className="space-y-4"><h2 className="text-2xl font-bold">{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph} className="leading-relaxed text-zinc-300">{paragraph}</p>)}</section>)}
    <section className="space-y-3 text-sm"><h2 className="text-xl font-bold">Provider information and sources</h2><ul className="flex flex-wrap gap-5 text-orange-400 underline underline-offset-4"><li><a href="https://betterlytics.io/privacy">Betterlytics</a></li><li><a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj">GDPR</a></li></ul></section>
  </LegalPage>;
}
