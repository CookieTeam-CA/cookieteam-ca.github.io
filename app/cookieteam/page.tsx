import Link from "next/link";
import Footer from "../components/Footer";
import CookieTeamClient from "./CookieTeamClient";

export default function CookieTeamPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      <nav className="absolute top-0 left-0 p-6 z-10">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            ← Zurück
        </Link>
      </nav>

      <CookieTeamClient />
      
      <Footer/>
    </div>
  );
}
