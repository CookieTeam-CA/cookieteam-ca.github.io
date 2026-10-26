import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() { return <div className="stats-empty"><h1>Eintrag nicht gefunden.</h1><p>Dieser Spieler, diese Statistik oder dieses Achievement ist noch nicht erfasst.</p><Button asChild size="lg" className="mt-5"><Link href="/stats">Zur Statistikübersicht</Link></Button></div>; }
