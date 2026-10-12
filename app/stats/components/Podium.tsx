import Link from "next/link";
import { Crown, Medal } from "lucide-react";
import { playerHref } from "../lib/api";
import PlayerVisual from "./PlayerVisual";
import AnimatedNumber from "./AnimatedNumber";

export default function Podium({ players }: { players: { uuid: string; username: string; points: number; rank: number }[] }) {
  return <div className="stats-podium">{players.slice(0, 3).map(player => <Link href={playerHref(player.uuid)} key={player.uuid} className={`stats-podium-card podium-${player.rank}`}>
    <span className="stats-podium-medal">{player.rank === 1 ? <Crown size={22} /> : <Medal size={22} />} Platz {player.rank}</span>
    <PlayerVisual uuid={player.uuid} username={player.username} skin priority /><h2>{player.username}</h2><strong><AnimatedNumber value={player.points.toLocaleString("de-DE")} /> <span className="stats-podium-unit">Punkte</span></strong><span className="stats-podium-link">Spielerprofil ↗</span>
  </Link>)}</div>;
}
