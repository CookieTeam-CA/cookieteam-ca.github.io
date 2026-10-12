import { notFound, permanentRedirect } from "next/navigation";
import type { Query } from "../../components/UI";
import { queryParams } from "../../lib/collections";

export default async function LegacyLeaderboard({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Promise<Query> }) {
  const [{ type }, query] = await Promise.all([params, searchParams]);
  const target = ({ points: "/stats/punkte", stats: "/stats/statistiken", advancements: "/stats/achievements" } as Record<string, string>)[type];
  if (!target) notFound();
  const paramsOut = queryParams(query);
  permanentRedirect(`${target}${paramsOut.size ? `?${paramsOut}` : ""}`);
}
