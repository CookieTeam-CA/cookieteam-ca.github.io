import type { Metadata } from "next";
import Catalog from "../components/Catalog";
import { Hero, type Query } from "../components/UI";

export const metadata: Metadata = { title: "Statistiken", alternates: { canonical: "/stats/statistiken" } };
export default async function StatisticsPage({ searchParams }: { searchParams: Promise<Query> }) {
  return <><Hero title="Jeder Block zählt" eyebrow="STATISTIKEN / CA6" description="Crafting, Mining, kaputte Werkzeuge und mehr. Finde eine Statistik und entdecke ihre besten Spieler." /><Catalog query={await searchParams} /></>;
}
