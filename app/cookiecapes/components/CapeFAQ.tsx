import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getTranslations } from "../i18n/server";

const questions = [
  ["Is CookieCapes free?", "CookieCapes is free to use. Install the mod to see and select capes in Minecraft."],
  ["How do I upload my own cape?", "Sign in with Discord, link your Minecraft account through MC-ID, then follow the upload steps in your account. You can also create a design in the cape editor."],
  ["Why can other players not see my cape?", "Players need the CookieCapes mod to see CookieCapes designs in the game. Check that the mod is installed and that you have selected a cape."],
  ["Which files can I upload?", "Use PNG, JPG, GIF, APNG or WebP. Static images can be up to 3 MiB and 4096 × 4096 pixels. Animations can be up to 32 MiB, 200 frames and 512 × 300 pixels per frame. Multiple PNGs become an animation."],
  ["How many capes can I upload?", "You have three uploads or image replacements per account per UTC day. Your account shows the remaining allowance and reset time. Renaming, visibility changes, deleting and restoring do not use this allowance."],
  ["What does the blue badge mean?", "The blue badge verifies the uploader's Minecraft identity at the time of upload. It does not verify copyright ownership of the design."],
  ["Can I keep a cape private?", "Yes. Choose the private option when uploading, or change visibility in your account. Private capes are not listed in the public gallery."],
  ["Can I restore a deleted cape?", "Yes. Deleted capes are unequipped immediately and can be restored from your account for 30 days. After that, they are permanently deleted."],
] as const;

export default async function CapeFAQ() {
  const { t } = await getTranslations();
  return <section className="cape-faq" aria-labelledby="cape-faq-title">
    <div className="cape-faq-heading"><h2 id="cape-faq-title">{t("FAQ about CookieCapes")}</h2><Link href="/cookiecapes/tutorial">{t("Learn how to design your own Cape, step by step.")} ↗</Link></div>
    <Accordion type="single" collapsible className="cape-faq-list">
      {questions.map(([question, answer], index) => <AccordionItem key={question} value={`question-${index}`}><AccordionTrigger>{t(question)}</AccordionTrigger><AccordionContent><p>{t(answer)}</p></AccordionContent></AccordionItem>)}
    </Accordion>
  </section>;
}
