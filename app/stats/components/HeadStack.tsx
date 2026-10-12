import Link from "next/link";
import PlayerVisual from "./PlayerVisual";
import { playerHref } from "../lib/api";

export default function HeadStack({ players, total }: { players: { uuid: string; username: string }[]; total: number }) {
  if (!total) return <span className="stats-muted">Noch keine Spieler</span>;
  return <div className="stats-head-stack" aria-label={`${total} Spieler auf dem Leaderboard`}>
    {players.slice(0, 5).map(player => <Link prefetch={false} key={player.uuid} href={playerHref(player.uuid)} className="stats-head-tooltip" aria-label={`Profil von ${player.username}`}>
      <PlayerVisual uuid={player.uuid} username={player.username} size={28} /><span className="stats-tooltip" role="tooltip">{player.username}</span>
    </Link>)}
    {total > 5 && <span className="stats-head-more" title={`${total - 5} weitere Spieler`}>+{total - 5}</span>}
  </div>;
}
