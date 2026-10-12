import type { Metadata } from "next";
import StatsNav from "./components/StatsNav";
import { Rules } from "./components/UI";
import { SearchProvider } from "./components/SearchProvider";
import Footer from "../components/Footer";
import "./stats.css";
import "slot-text/style.css";

export const metadata: Metadata = { title: { default: "Stats", template: "%s - Stats | CookieAttack" }, description: "Alle CookieAttack 6 Statistiken, Leaderboards, Achievements und Spielerprofile.", alternates: { canonical: "/stats" } };
export const dynamic = "force-dynamic";
export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return <div className="stats-site"><StatsNav /><SearchProvider><main className="stats-main">{children}<Rules /></main></SearchProvider><Footer /></div>;
}
