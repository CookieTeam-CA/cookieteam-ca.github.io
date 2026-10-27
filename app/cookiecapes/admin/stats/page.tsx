import { loadAdminStats } from "./server";
import { statsRange, type StatsSearch } from "./types";
import Dashboard from "./Dashboard";
import StatsWorkspace from "./StatsWorkspace";
import Footer from "@/app/components/Footer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin-Statistik · CookieCapes", robots: { index: false, follow: false } };

export default async function AdminStatsPage({ searchParams }: { searchParams: Promise<StatsSearch> }) {
  const params = await searchParams;
  const result = await loadAdminStats(params);
  const range = result.range ?? statsRange({});
  const sort = typeof params.sort === "string" && ["requests", "errors", "latency"].includes(params.sort) ? params.sort : "requests";
  return <>
    <StatsWorkspace range={range} sort={sort} error={result.error}>
      {result.data && <Dashboard data={result.data} range={range} sort={sort} />}
    </StatsWorkspace>
    <Footer />
  </>;
}
