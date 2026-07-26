import Link from "next/link";
import { getAdvancementInfo, getAdvancementLeaderboard, AdvancementLeaderboardEntry, AdvancementInfo } from "@/app/lib/stats-api";
import { ShieldAlert, Sparkles, ChevronLeft, Calendar } from "lucide-react";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ advancement: string[] }>;
}

export default async function AdvancementLeaderboardPage({ params }: PageProps) {
  const { advancement } = await params;
  const advancementKey = advancement.join("/");

  let leaderboard: AdvancementLeaderboardEntry[] = [];
  let advInfo: AdvancementInfo | null = null;
  let errorMsg = "";

  try {
    const [lbData, infoData] = await Promise.all([
      getAdvancementLeaderboard(advancementKey),
      getAdvancementInfo(advancementKey).catch(() => null),
    ]);

    leaderboard = lbData;
    advInfo = infoData;
  } catch (err) {
    console.error("Failed to load advancement leaderboard:", err);
    errorMsg = "Das Leaderboard für dieses Advancement konnte nicht geladen werden.";
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/leaderboards/advancements"
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
          <div className="bg-zinc-900/30 border border-white/5 p-6 md:p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-400 border border-white/5 uppercase tracking-wider">
                {advInfo?.tab || "Advancement"}
              </span>
              {advInfo?.points && (
                <span className="inline-flex items-center gap-1 text-xs text-orange-400 font-bold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-lg">
                  <Sparkles size={12} />
                  {advInfo.points} Punkte
                </span>
              )}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-nexa tracking-tighter text-white">
                {advInfo?.display_name || advancementKey.split("/").pop()}
              </h1>
              {advInfo?.description && (
                <p className="text-zinc-400 text-base max-w-3xl leading-relaxed">
                  {advInfo.description}
                </p>
              )}
              <p className="text-zinc-500 text-xs font-mono pt-1">{advancementKey}</p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden shadow-xl">
            {leaderboard.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                Dieses Advancement wurde noch von keinem Spieler freigeschaltet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-400 text-xs font-semibold uppercase tracking-widest bg-zinc-950/40">
                      <th className="py-4 px-6 text-center w-24">Rang</th>
                      <th className="py-4 px-6">Spieler</th>
                      <th className="py-4 px-6 text-right w-56">Freigeschaltet am</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => {
                      const isTop3 = entry.rank <= 3;
                      const medalMap = ["🥇", "🥈", "🥉"];
                      const textColors = [
                        "text-yellow-400 font-bold",
                        "text-zinc-300 font-bold",
                        "text-amber-600 font-bold",
                      ];

                      return (
                        <tr
                          key={entry.player}
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
                              href={`/player/${entry.player}`}
                              className="flex items-center gap-3"
                            >
                              <img
                                src={`https://minotar.net/avatar/${entry.player}/32`}
                                alt={entry.player}
                                className="w-8 h-8 rounded-full border border-white/10 group-hover:scale-105 transition-transform"
                                style={{ imageRendering: "pixelated" }}
                              />
                              <span className="font-bold text-zinc-100 group-hover:text-orange-500 transition-colors">
                                {entry.player}
                              </span>
                            </Link>
                          </td>
                          <td className="py-4 px-6 text-right text-sm text-zinc-400">
                            <div className="flex items-center justify-end gap-2">
                              <Calendar size={14} className="text-zinc-600" />
                              <span className={isTop3 ? textColors[entry.rank - 1] : ""}>
                                {formatDate(entry.completed_at)}
                              </span>
                            </div>
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
