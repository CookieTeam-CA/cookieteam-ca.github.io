import { getAllAdvancements, getAdvancementLeaderboard } from "@/app/lib/stats-api";
import AdvancementsOverviewClient from "./AdvancementsOverviewClient";
import { Sparkles, ShieldAlert } from "lucide-react";

export const revalidate = 300; // Revalidate every minute

interface AdvancementItem {
  id: string;
  display_name: string;
  description: string | null;
  tab: string;
  completedCount: number;
  firstPlayer: string | null;
}

export default async function AdvancementsPage() {
  let mappedAdvancements: AdvancementItem[] = [];
  let errorMsg = "";

  try {
    const advancements = await getAllAdvancements();

    // Map each advancement to fetch its completedCount and firstPlayer
    mappedAdvancements = await Promise.all(
      advancements.map(async (adv) => {
        try {
          const lb = await getAdvancementLeaderboard(adv.id);
          return {
            id: adv.id,
            display_name: adv.display_name,
            description: adv.description,
            tab: adv.tab,
            completedCount: lb.length,
            firstPlayer: lb.length > 0 ? lb[0].player : null,
          };
        } catch (lbErr) {
          console.error(`Failed to load leaderboard for advancement ${adv.id}:`, lbErr);
          return {
            id: adv.id,
            display_name: adv.display_name,
            description: adv.description,
            tab: adv.tab,
            completedCount: 0,
            firstPlayer: null,
          };
        }
      })
    );
  } catch (err) {
    console.error("Failed to load advancements overview:", err);
    errorMsg = "Die Advancements konnten nicht geladen werden. Bitte versuche es später erneut.";
  }

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-nexa tracking-tighter">
          Minecraft <span className="text-orange-500">Advancements</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Alle Errungenschaften der Spieler auf dem Server. Wer war als Erstes im Nether oder hat den Drachen bezwungen?
        </p>
      </div>

      {errorMsg ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center text-zinc-300 flex flex-col items-center gap-3 max-w-xl mx-auto">
          <ShieldAlert className="text-red-500" size={32} />
          <p className="font-medium">{errorMsg}</p>
        </div>
      ) : (
        <AdvancementsOverviewClient initialAdvancements={mappedAdvancements} />
      )}
    </div>
  );
}
