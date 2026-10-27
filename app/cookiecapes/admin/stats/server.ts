import "server-only";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { isCookieCapesAdmin } from "@/lib/cookiecapes-admin";
import { cookieApiUrl } from "@/lib/cookieapi-adapter";
import { statsRange, type AdminStats, type StatsRange, type StatsSearch } from "./types";

export async function loadAdminStats(params: StatsSearch): Promise<{ data?: AdminStats; range?: StatsRange; error?: string }> {
  let session;
  try { session = await auth(); }
  catch { return { error: "Deine Anmeldung konnte nicht geprüft werden. Bitte erneut versuchen." }; }
  if (!session?.user) redirect("/cookiecapes/account");
  if (!isCookieCapesAdmin(session.user)) notFound();

  let range;
  try { range = statsRange(params); }
  catch (error) { return { error: (error as Error).message }; }
  const token = process.env.COOKIECAPES_API_TOKEN;
  if (!token) return { range, error: "Die Statistik ist noch nicht konfiguriert. Bitte die API-Zugangsdaten auf dem Server prüfen." };
  try {
    const response = await fetch(`${cookieApiUrl()}/admin/stats?${new URLSearchParams(range)}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return { range, error: `Die Statistik konnte nicht geladen werden (HTTP ${response.status}). Bitte erneut versuchen.` };
    const data: AdminStats = await response.json();
    if (!data.collection || !data.overview || !data.performance || !Array.isArray(data.daily) || !Array.isArray(data.top_capes) || !Array.isArray(data.routes)) {
      throw new Error("Invalid statistics response");
    }
    return { range, data };
  } catch { return { range, error: "Die Statistik-API ist vorübergehend nicht erreichbar oder hat eine ungültige Antwort geliefert. Bitte erneut versuchen." }; }
}
