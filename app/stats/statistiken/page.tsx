import type { Metadata } from "next";
import Catalog from "../components/Catalog";
import { type Query } from "../lib/query";
import { Hero } from "../components/UI";

export const metadata: Metadata = { title: "Statistiken", alternates: { canonical: "/stats/statistiken" } };
export default async function StatisticsPage({ searchParams }: { searchParams: Promise<Query> }) {
  return <><Hero title="Jeder Block zählt" description="Finde eine Statistik und entdecke ihre besten Spieler." /><Catalog query={await searchParams} /></>;
}
