import { getAllStats, getStatsOverview } from "@/app/lib/stats-api";
import StatsOverviewClient from "./StatsOverviewClient";
import { Sparkles, ShieldAlert } from "lucide-react";

export const revalidate = 300;

export default async function StatsOverviewPage() {
  let initialStats: Array<{
    stat: string;
    id: string;
    category: string;
    leader: string;
    value: number;
  }> = [];
  let errorMsg = "";

  try {
    const [overview, allStats] = await Promise.all([getStatsOverview(), getAllStats()]);

    initialStats = overview.map((item) => {
      const matched =
        allStats.find((s) => s.display_name.toLowerCase() === item.stat.toLowerCase()) ||
        allStats.find(
          (s) =>
            s.display_name.toLowerCase().replace(/[^a-z0-9]/g, "") ===
            item.stat.toLowerCase().replace(/[^a-z0-9]/g, "")
        );

      let statId = matched?.id;
      let category = matched?.category || "General";

      if (!statId) {
        const cleanName = item.stat.toLowerCase().replace(/\s+/g, "_");
        statId = `minecraft:custom/minecraft:${cleanName}`;
      }

      return {
        stat: item.stat,
        id: statId,
        category,
        leader: item.leader,
        value: item.value,
      };
    });
  } catch (err) {
    console.error("Failed to load stats overview:", err);
    errorMsg = "Die Statistiken konnten nicht geladen werden. Bitte versuche es später erneut.";
  }

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-nexa tracking-tighter">
          Minecraft <span className="text-orange-500">Statistiken</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Übersicht über aller Spieler Statistiken.
        </p>
      </div>

      {errorMsg ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center text-zinc-300 flex flex-col items-center gap-3 max-w-xl mx-auto">
          <ShieldAlert className="text-red-500" size={32} />
          <p className="font-medium">{errorMsg}</p>
        </div>
      ) : (
        <StatsOverviewClient initialStats={initialStats} />
      )}
    </div>
  );
}
