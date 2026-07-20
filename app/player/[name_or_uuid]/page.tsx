import Link from "next/link";
import {
  getPlayerProfile,
  getPlayerPointsBreakdown,
  getPlayerStats,
  getAllStats,
  getPlayerAchievements,
  getPlayerStatRank,
  getAllAdvancements,
  getAdvancementLeaderboard,
  PlayerProfile,
  PlayerPointsBreakdown,
  PlayerStatsResponse,
  StatInfo,
  PlayerAchievementsResponse,
  AdvancementInfo,
} from "@/app/lib/stats-api";
import {
  getPlayerHistory,
  getPlayer,
  Player,
  SkinHistoryEntry,
} from "@/app/cookiecapes/lib/api";
import PlayerStatsTable from "./PlayerStatsTable";
import ProfileSkinDisplay from "@/app/cookiecapes/components/ProfileSkinDisplay";
import { ShieldAlert, Award, Star, Trophy, Sparkles, CheckCircle2, XCircle } from "lucide-react";

export const revalidate = 300

interface PageProps {
  params: Promise<{ name_or_uuid: string }>;
}

export default async function PlayerProfilePage({ params }: PageProps) {
  const { name_or_uuid } = await params;

  let profile: PlayerProfile | null = null;
  let pointsBreakdown: PlayerPointsBreakdown | null = null;
  let playerStats: PlayerStatsResponse | null = null;
  let allStats: StatInfo[] = [];
  let achievements: PlayerAchievementsResponse | null = null;
  let allAdvancements: AdvancementInfo[] = [];
  let skinHistory: SkinHistoryEntry[] = [];
  let cookieCapesPlayer: Player | null = null;
  let errorMsg = "";

  try {
    const fetchedProfile = await getPlayerProfile(name_or_uuid);
    profile = fetchedProfile;

    const [statsData, schemaData, achievementsData, advancementsSchema, historyData, capesData, pointsData] =
      await Promise.all([
        getPlayerStats(fetchedProfile.uuid).catch(() => ({ uuid: fetchedProfile.uuid, username: fetchedProfile.name, last_sync: "", stats: {} })),
        getAllStats().catch(() => []),
        getPlayerAchievements(fetchedProfile.uuid).catch(() => ({ uuid: fetchedProfile.uuid, username: fetchedProfile.name, last_sync: "", achievements: [], percentage: 0, total_achievements: 126, achievements_count: 0 })),
        getAllAdvancements().catch(() => []),
        getPlayerHistory(fetchedProfile.name).catch(() => null),
        getPlayer(fetchedProfile.uuid).catch(() => null),
        getPlayerPointsBreakdown(fetchedProfile.uuid).catch(() => null),
      ]);

    playerStats = statsData;
    allStats = schemaData;
    achievements = achievementsData;
    allAdvancements = advancementsSchema;
    cookieCapesPlayer = capesData;
    pointsBreakdown = pointsData;
    skinHistory = historyData?.skin_history || [];
  } catch (err) {
    console.error("Failed to load player profile:", err);
    errorMsg = "Spieler konnte nicht gefunden werden oder ein Fehler ist aufgetreten.";
  }

  if (errorMsg || !profile) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center text-zinc-300 flex flex-col items-center gap-3 max-w-xl mx-auto my-12">
        <ShieldAlert className="text-red-500" size={36} />
        <h2 className="text-xl font-bold">Profilfehler</h2>
        <p className="font-medium">{errorMsg || "Spieler existiert nicht."}</p>
        <Link
          href="/leaderboards/points"
          className="mt-4 px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
        >
          Zurück zur Bestenliste
        </Link>
      </div>
    );
  }

  const mappedStats = await Promise.all(
    allStats.map(async (s) => {
      const value = playerStats?.stats?.[s.id] || 0;
      let rank: number | null = null;
      
      if (value > 0) {
        try {
          const rankData = await getPlayerStatRank(profile.uuid, s.id);
          rank = rankData.rank;
        } catch (e) {
        }
      }

      return {
        id: s.id,
        display_name: s.display_name,
        category: s.category,
        value,
        rank,
      };
    })
  );

  const unlockedAchievementsMap = new Map(
    achievements?.achievements?.map((a) => [a.achievement, a]) || []
  );

  const unlockRanksMap = new Map<string, number>();
  if (achievements?.achievements && achievements.achievements.length > 0) {
    await Promise.all(
      achievements.achievements.map(async (a) => {
        try {
          const lb = await getAdvancementLeaderboard(a.achievement);
          const matchIndex = lb.findIndex(
            (x) => x.player.toLowerCase() === profile.name.toLowerCase()
          );
          if (matchIndex !== -1) {
            unlockRanksMap.set(a.achievement, matchIndex + 1);
          }
        } catch (e) {
        }
      })
    );
  }

  const mappedAdvancements = allAdvancements.map((adv) => {
    const unlockData = unlockedAchievementsMap.get(adv.id);
    const completed = !!unlockData;
    const unlockRank = unlockRanksMap.get(adv.id) || null;

    return {
      id: adv.id,
      display_name: adv.display_name,
      description: adv.description,
      tab: adv.tab,
      completed,
      unlocked_at: unlockData ? unlockData.unlocked_at : null,
      unlockRank,
    };
  });

  const currentCapeUrl =
    cookieCapesPlayer?.current_cape_id != null
      ? `https://api.cookieattack.de:8989/capes/${cookieCapesPlayer.current_cape_id}.png`
      : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <ProfileSkinDisplay
          currentCapeUrl={currentCapeUrl}
          displayName={profile.name}
          player={cookieCapesPlayer}
          isCookieCapesUser={!!cookieCapesPlayer}
          skinHistory={skinHistory}
        />

        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b border-white/5 pb-3">
            Spielerinformationen
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-zinc-500">Gesamtrang</span>
              <div className="flex items-center gap-1.5 font-bold text-orange-500 text-base">
                <Trophy size={16} />
                <span>#{profile.rank}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-zinc-500">Gesamtpunkte</span>
              <span className="font-bold text-white text-base font-nexa">{profile.points} Pkt.</span>
            </div>

            {pointsBreakdown && (
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3 mt-2">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold block">
                  Punkte Aufteilung
                </span>
                
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Statistiken:</span>
                  <span className="font-bold text-zinc-300">{pointsBreakdown.stats.points} Pkt.</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 pl-3">
                  <span>🥇 {pointsBreakdown.stats.gold}x | 🥈 {pointsBreakdown.stats.silver}x | 🥉 {pointsBreakdown.stats.bronze}x</span>
                </div>

                <div className="flex justify-between text-xs border-t border-white/5 pt-2">
                  <span className="text-zinc-400">Advancements:</span>
                  <span className="font-bold text-zinc-300">{pointsBreakdown.advancements.points} Pkt.</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 pl-3">
                  <span>🥇 {pointsBreakdown.advancements.gold}x | 🥈 {pointsBreakdown.advancements.silver}x | 🥉 {pointsBreakdown.advancements.bronze}x</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-12">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <h2 className="text-2xl md:text-3xl font-nexa text-white">
              Advancements
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-zinc-400 text-sm font-bold block">
                  {achievements?.achievements_count} / {achievements?.total_achievements} Freigeschaltet
                </span>
              </div>
              <div className="relative w-12 h-12 rounded-full border-2 border-orange-500/20 bg-orange-500/5 flex items-center justify-center font-bold text-sm text-orange-500 font-nexa">
                {Math.round(achievements?.percentage || 0)}%
              </div>
            </div>
          </div>

          {mappedAdvancements.length === 0 ? (
            <div className="bg-zinc-900/10 border border-white/5 rounded-2xl p-6 text-center text-zinc-500">
              Keine Advancements geladen.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-105 overflow-y-auto pr-2 border border-white/5 rounded-2xl p-4 bg-zinc-900/10">
              {mappedAdvancements.map((adv) => {
                const medalMap = ["🥇", "🥈", "🥉"];
                return (
                  <Link
                    key={adv.id}
                    href={`/leaderboards/advancements/${adv.id}`}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-2 hover:bg-zinc-900/30 hover:border-orange-500/30 transition-all ${
                      adv.completed
                        ? "bg-zinc-900/40 border-green-500/20"
                        : "bg-black/20 border-white/5 opacity-60"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-zinc-500">
                          {adv.tab}
                        </span>
                        {adv.completed ? (
                          <div className="flex items-center gap-1 text-[10px] text-green-400 font-bold">
                            <CheckCircle2 size={12} />
                            Freigeschaltet
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                            <XCircle size={12} />
                            Gesperrt
                          </div>
                        )}
                      </div>
                      <h4 className="font-bold text-zinc-100 text-sm leading-tight">
                        {adv.display_name}
                      </h4>
                      {adv.description && (
                        <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">
                          {adv.description}
                        </p>
                      )}
                    </div>

                    {adv.completed && adv.unlockRank && adv.unlockRank <= 3 && (
                      <div className="flex items-center gap-1 text-xs font-bold text-zinc-300 pt-1 border-t border-white/5 mt-1">
                        <span>Freischaltungs-Medaille:</span>
                        <span className="text-lg">{medalMap[adv.unlockRank - 1]}</span>
                        <span className="text-[10px] text-zinc-500">({adv.unlockRank}. Platz)</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Player Stats Table */}
        <div className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-nexa text-white border-b border-white/5 pb-4">
            Spieler-Statistiken
          </h2>
          <PlayerStatsTable stats={mappedStats} />
        </div>
      </div>
    </div>
  );
}
