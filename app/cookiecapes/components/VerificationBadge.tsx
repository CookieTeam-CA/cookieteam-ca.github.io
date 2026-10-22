import { BadgeCheck } from "lucide-react";
import type { CapeVerification } from "../lib/api";
export default function VerificationBadge({ verification }: { verification?: CapeVerification }) {
  if (verification !== "website" && verification !== "minecraft_session") return null;
  const text = verification === "website"
    ? "Über einen verknüpften Minecraft-Account hochgeladen oder übernommen. Identität bestätigt; keine Bestätigung der Motiv-Urheberschaft."
    : "Mit einer authentifizierten Minecraft-Sitzung hochgeladen. Identität bestätigt; keine Bestätigung der Motiv-Urheberschaft.";
  return <span title={text} aria-label={text} role="img" className={`inline-flex align-middle ${verification === "website" ? "text-blue-400" : "text-orange-400"}`}><BadgeCheck size={20} aria-hidden="true" /></span>;
}
