import type { Metadata } from "next";
import Catalog from "../components/Catalog";
import { type Query } from "../lib/query";
import { Hero } from "../components/UI";
export const metadata: Metadata = { title: "Achievements", alternates: { canonical: "/stats/achievements" } };
export default async function AchievementsPage({ searchParams }: { searchParams: Promise<Query> }) { return <><Hero title="Sei der Erste" description="Wer hat es zuerst geschafft? Für jedes Achievement zählt der früheste Abschluss. Die ersten drei Spieler erhalten 5, 3 und 3 Punkte." /><Catalog query={await searchParams} achievement /></>; }
