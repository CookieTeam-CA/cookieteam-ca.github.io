import LeaderboardNavbar from "./components/LeaderboardNavbar";
import Footer from "../components/Footer";

export default function LeaderboardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <LeaderboardNavbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 pt-28 pb-12">
        {children}
      </main>
      <Footer />
    </div>
  );
}
