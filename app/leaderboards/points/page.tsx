import Link from "next/link";
import { getPointsLeaderboard, PointsLeaderboardEntry } from "@/app/lib/stats-api";
import { Award, ShieldAlert } from "lucide-react";

export const revalidate = 300;

export default async function PointsLeaderboardPage() {
  let players: PointsLeaderboardEntry[] = [];
  let errorMsg = "";

  try {
    players = await getPointsLeaderboard();
  } catch (err) {
    console.error("Failed to fetch points leaderboard:", err);
    errorMsg = "Die Bestenliste konnte nicht geladen werden. Bitte versuche es später erneut.";
  }

  const topThree = players.slice(0, 3);
  const remainingPlayers = players.slice(3);

  const podiumStyles = [
    {
      cardBg: "bg-gradient-to-b from-yellow-500/20 via-zinc-900/50 to-zinc-900/80 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.15)]",
      badgeColor: "bg-yellow-500 text-black",
      medal: "🥇",
      height: "h-[190px] md:h-[220px]",
      scale: "scale-105 z-10",
      textColor: "text-yellow-400",
    },
    {
      cardBg: "bg-gradient-to-b from-zinc-400/20 via-zinc-900/50 to-zinc-900/80 border-zinc-400/40 shadow-[0_0_20px_rgba(156,163,175,0.1)]",
      badgeColor: "bg-zinc-400 text-black",
      medal: "🥈",
      height: "h-[160px] md:h-[190px]",
      scale: "scale-100",
      textColor: "text-zinc-300",
    },
    {
      cardBg: "bg-gradient-to-b from-amber-700/20 via-zinc-900/50 to-zinc-900/80 border-amber-700/40 shadow-[0_0_20px_rgba(180,83,9,0.1)]",
      badgeColor: "bg-amber-700 text-white",
      medal: "🥉",
      height: "h-[140px] md:h-[170px]",
      scale: "scale-95",
      textColor: "text-amber-500",
    },
  ];

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-nexa tracking-tighter">
          Globales <span className="text-orange-500">Punkte-Leaderboard</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Die besten Minecraft-Spieler von CookieAttack 6, sortiert nach ihren Gesamtpunkten. Wer wird der ultimative Champion?
        </p>
      </div>

      {errorMsg ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center text-zinc-300 flex flex-col items-center gap-3 max-w-xl mx-auto">
          <ShieldAlert className="text-red-500" size={32} />
          <p className="font-medium">{errorMsg}</p>
        </div>
      ) : players.length === 0 ? (
        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-12 text-center text-zinc-500 max-w-xl mx-auto">
          Es sind noch keine Daten im Leaderboard vorhanden.
        </div>
      ) : (
        <>
          {/* Podium for Top 3 */}
          {topThree.length > 0 && (
            <div className="flex flex-col sm:flex-row items-end justify-center gap-6 max-w-4xl mx-auto pt-6 px-4">
              {/* 2nd Place */}
              {topThree[1] && (
                <Link
                  href={`/player/${topThree[1].player}`}
                  className={`w-full sm:w-1/3 order-2 sm:order-1 transition-all duration-300 hover:scale-[1.03] ${podiumStyles[1].scale}`}
                >
                  <div className={`flex flex-col items-center justify-between rounded-3xl border p-6 text-center ${podiumStyles[1].cardBg} ${podiumStyles[1].height}`}>
                    <span className="text-3xl">{podiumStyles[1].medal}</span>
                    <div className="space-y-2">
                      <div className="relative w-16 h-16 mx-auto rounded-full border border-white/10 bg-zinc-950/50 flex items-center justify-center p-1.5 overflow-hidden">
                        <img
                          src={`https://minotar.net/avatar/${topThree[1].player}/48`}
                          alt={topThree[1].player}
                          className="w-full h-full rounded-full object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                      <h3 className="font-bold text-zinc-100 truncate max-w-37.5">{topThree[1].player}</h3>
                    </div>
                    <div>
                      <span className={`text-2xl font-bold font-nexa ${podiumStyles[1].textColor}`}>
                        {topThree[1].points}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-semibold">Punkte</span>
                    </div>
                  </div>
                </Link>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <Link
                  href={`/player/${topThree[0].player}`}
                  className={`w-full sm:w-1/3 order-1 sm:order-2 transition-all duration-300 hover:scale-[1.08] ${podiumStyles[0].scale}`}
                >
                  <div className={`flex flex-col items-center justify-between rounded-3xl border p-6 text-center ${podiumStyles[0].cardBg} ${podiumStyles[0].height}`}>
                    <span className="text-4xl">{podiumStyles[0].medal}</span>
                    <div className="space-y-2">
                      <div className="relative w-20 h-20 mx-auto rounded-full border-2 border-yellow-500 bg-zinc-950/50 flex items-center justify-center p-1.5 overflow-hidden">
                        <img
                          src={`https://minotar.net/avatar/${topThree[0].player}/64`}
                          alt={topThree[0].player}
                          className="w-full h-full rounded-full object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                      <h3 className="font-bold text-white text-lg truncate max-w-37.5">{topThree[0].player}</h3>
                    </div>
                    <div>
                      <span className={`text-3xl font-bold font-nexa ${podiumStyles[0].textColor}`}>
                        {topThree[0].points}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-semibold">Punkte</span>
                    </div>
                  </div>
                </Link>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <Link
                  href={`/player/${topThree[2].player}`}
                  className={`w-full sm:w-1/3 order-3 sm:order-3 transition-all duration-300 hover:scale-[1.03] ${podiumStyles[2].scale}`}
                >
                  <div className={`flex flex-col items-center justify-between rounded-3xl border p-6 text-center ${podiumStyles[2].cardBg} ${podiumStyles[2].height}`}>
                    <span className="text-3xl">{podiumStyles[2].medal}</span>
                    <div className="space-y-2">
                      <div className="relative w-16 h-16 mx-auto rounded-full border border-white/10 bg-zinc-950/50 flex items-center justify-center p-1.5 overflow-hidden">
                        <img
                          src={`https://minotar.net/avatar/${topThree[2].player}/48`}
                          alt={topThree[2].player}
                          className="w-full h-full rounded-full object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                      <h3 className="font-bold text-zinc-200 truncate max-w-37.5">{topThree[2].player}</h3>
                    </div>
                    <div>
                      <span className={`text-2xl font-bold font-nexa ${podiumStyles[2].textColor}`}>
                        {topThree[2].points}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-semibold">Punkte</span>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* Points Calculation Explanation */}
          <div className="max-w-4xl mx-auto bg-zinc-900/40 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Award className="text-orange-500" size={24} />
              <h2 className="text-xl md:text-2xl font-bold">Wie berechnen sich die Punkte?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/30 border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-400">Statistiken</span>
                </div>
                <p className="text-sm text-zinc-400">
                  Wer in einer Minecraft-Statistik unter den Top 3 auf dem Server landet, erhält Punkte für das globale Ranking:
                </p>
                <div className="flex justify-between items-center text-sm border-t border-white/5 pt-2">
                  <span className="flex items-center gap-1.5">🥇 Platz 1</span>
                  <span className="font-bold text-yellow-400">+5 Punkte</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-white/5 pt-2">
                  <span className="flex items-center gap-1.5">🥈 Platz 2</span>
                  <span className="font-bold text-zinc-300">+3 Punkte</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-white/5 pt-2">
                  <span className="flex items-center gap-1.5">🥉 Platz 3</span>
                  <span className="font-bold text-amber-600">+1 Punkt</span>
                </div>
              </div>

              <div className="bg-black/30 border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-400">Advancements</span>
                </div>
                <p className="text-sm text-zinc-400">
                  Punkte gibt es auch für das Freischalten von Advancements. Die schnellsten Spieler erhalten zusätzliche Punkte:
                </p>
                <div className="flex justify-between items-center text-sm border-t border-white/5 pt-2">
                  <span className="flex items-center gap-1.5">🥇 1. Freischaltung</span>
                  <span className="font-bold text-yellow-400">+5 Punkte</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-white/5 pt-2">
                  <span className="flex items-center gap-1.5">🥈 2. Freischaltung</span>
                  <span className="font-bold text-zinc-300">+3 Punkte</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-white/5 pt-2">
                  <span className="flex items-center gap-1.5">🥉 3. Freischaltung</span>
                  <span className="font-bold text-amber-600">+1 Punkt</span>
                </div>
              </div>
            </div>
          </div>

          {/* Remaining Players List */}
          {remainingPlayers.length > 0 && (
            <div className="max-w-4xl mx-auto bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-400 text-xs font-semibold uppercase tracking-widest bg-zinc-950/40">
                      <th className="py-4 px-6 text-center w-20">Rang</th>
                      <th className="py-4 px-6">Spieler</th>
                      <th className="py-4 px-6 text-right w-40">Gesamtpunkte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remainingPlayers.map((player) => (
                      <tr
                        key={player.uuid}
                        className="border-b border-white/5 hover:bg-white/2 transition-colors group cursor-pointer"
                      >
                        <td className="py-4 px-6 text-center font-bold text-zinc-400">
                          {player.rank}
                        </td>
                        <td className="py-4 px-6">
                          <Link href={`/player/${player.player}`} className="flex items-center gap-3">
                            <img
                              src={`https://minotar.net/avatar/${player.player}/32`}
                              alt={player.player}
                              className="w-8 h-8 rounded-full border border-white/10 transition-transform group-hover:scale-105"
                              style={{ imageRendering: "pixelated" }}
                            />
                            <span className="font-bold text-zinc-100 group-hover:text-orange-500 transition-colors">
                              {player.player}
                            </span>
                          </Link>
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-white font-nexa text-lg">
                          {player.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
