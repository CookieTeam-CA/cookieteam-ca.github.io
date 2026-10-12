import Link from "next/link";
export default function NotFound() { return <div className="stats-empty"><h1>Eintrag nicht gefunden.</h1><p>Dieser Spieler, diese Statistik oder dieses Achievement ist noch nicht erfasst.</p><Link href="/stats" className="stats-button">Zur Statistikübersicht</Link></div>; }
