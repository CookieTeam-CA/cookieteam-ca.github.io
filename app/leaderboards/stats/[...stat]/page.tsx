import Link from "next/link";
import { getStatInfo, getStatLeaderboard, getAllStats, StatLeaderboardEntry, StatDetails } from "@/app/lib/stats-api";
import { ShieldAlert, TrendingUp, ChevronLeft } from "lucide-react";

export const revalidate = 300; // Revalidate every minute

interface PageProps {
  params: Promise<{ stat: string[] }>;
}

export default async function StatLeaderboardPage({ params }: PageProps) {
  const { stat } = await params;
  const statKey = stat.join("/");

  let leaderboard: StatLeaderboardEntry[] = [];
  let statInfo: StatDetails | null = null;
  let displayName = statKey;
  let errorMsg = "";

  try {
    const [lbData, infoData, allStats] = await Promise.all([
      getStatLeaderboard(statKey),
      getStatInfo(statKey).catch(() => null),
      getAllStats().catch(() => []),
    ]);

    leaderboard = lbData;
    statInfo = infoData;

    const matched = allStats.find((s) => s.id === statKey);
    if (matched) {
      displayName = matched.display_name;
    } else {
      const lastPart = statKey.split("/").pop() || statKey;
      displayName = lastPart
        .replace(/^minecraft:/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  } catch (err) {
    console.error("Failed to load stat leaderboard:", err);
    errorMsg = "Das Leaderboard für diese Statistik konnte nicht geladen werden.";
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/leaderboards/stats"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-semibold"
        >
          <ChevronLeft size={16} />
          Zurück zur Übersicht
        </Link>
      </div>

      {errorMsg ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center text-zinc-300 flex flex-col items-center gap-3 max-w-xl mx-auto">
          <ShieldAlert className="text-red-500" size={32} />
          <p className="font-medium">{errorMsg}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-zinc-900/30 border border-white/5 p-6 md:p-8 rounded-3xl">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-400 border border-white/5">
                {statInfo?.category || "General"}
              </div>
              <h1 className="text-3xl md:text-5xl font-nexa tracking-tighter text-white">
                {displayName}
              </h1>
              <p className="text-zinc-500 text-xs font-mono">{statKey}</p>
            </div>

            {statInfo && (
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 min-w-35 w-full md:w-auto">
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
                  <TrendingUp size={12} />
                  durchschnitt
                </div>
                <span className="text-xl font-bold font-nexa text-zinc-200">
                  {statInfo.average.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </span>
              </div>
            )}
          </div>

          <div className="max-w-4xl mx-auto bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden shadow-xl">
            {leaderboard.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                Für diese Statistik liegen noch keine Daten vor.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-400 text-xs font-semibold uppercase tracking-widest bg-zinc-950/40">
                      <th className="py-4 px-6 text-center w-24">Rang</th>
                      <th className="py-4 px-6">Spieler</th>
                      <th className="py-4 px-6 text-right w-44">Wert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => {
                      const isTop3 = entry.rank <= 3;
                      const medalMap = ["🥇", "🥈", "🥉"];
                      const textColors = [
                        "text-yellow-400",
                        "text-zinc-300",
                        "text-amber-600",
                      ];
                      
                      return (
                        <tr
                          key={entry.uuid}
                          className="border-b border-white/5 hover:bg-white/2 transition-colors group cursor-pointer"
                        >
                          <td className="py-4 px-6 text-center">
                            {isTop3 ? (
                              <span className="text-2xl" title={`${entry.rank}. Platz`}>
                                {medalMap[entry.rank - 1]}
                              </span>
                            ) : (
                              <span className="font-bold text-zinc-500">{entry.rank}</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <Link
                              href={`/player/${entry.username}`}
                              className="flex items-center gap-3"
                            >
                              <img
                                src={`https://minotar.net/avatar/${entry.username}/32`}
                                alt={entry.username}
                                className="w-8 h-8 rounded-full border border-white/10 group-hover:scale-105 transition-transform"
                                style={{ imageRendering: "pixelated" }}
                              />
                              <span className="font-bold text-zinc-100 group-hover:text-orange-500 transition-colors">
                                {entry.username}
                              </span>
                            </Link>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span
                              className={`font-bold font-nexa text-lg ${
                                isTop3 ? textColors[entry.rank - 1] : "text-white"
                              }`}
                            >
                              {entry.value.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
