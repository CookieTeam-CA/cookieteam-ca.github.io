import Footer from "@/app/components/Footer";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#080808] text-white">{children}<Footer /></div>;
}
