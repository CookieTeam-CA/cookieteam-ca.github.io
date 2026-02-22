import { ArrowLeft, User, Layers, Globe, History } from "lucide-react";
import Footer from "../../../components/Footer";

export default function PlayerProfileLoading() {
    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 animate-pulse">
                
                <div className="inline-flex items-center gap-2 text-zinc-600 mb-8">
                    <ArrowLeft size={20} />
                    <div className="h-5 w-40 bg-zinc-800 rounded"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                    <div className="lg:col-span-1">
                        <div className="aspect-[1/2] md:aspect-auto md:h-[600px] rounded-2xl bg-zinc-900/30 border border-white/5 p-6 flex flex-col items-center">
                            <div className="w-1/2 h-8 bg-zinc-800 rounded-lg mb-8 mt-4"></div>
                            <div className="w-4/5 h-3/4 bg-zinc-800 rounded-xl"></div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-zinc-800 shrink-0"></div>
                            <div className="h-5 w-64 bg-zinc-800 rounded mt-0.5"></div>
                        </div>

                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <User className="text-zinc-700" />
                                <div className="h-6 w-32 bg-zinc-800 rounded"></div>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5">
                                        <div className="h-3 w-16 bg-zinc-800 rounded mb-2"></div>
                                        <div className="h-5 w-full bg-zinc-700 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
                            <div className="h-6 w-40 bg-zinc-800 rounded mb-4 flex items-center gap-2"></div>
                            <div className="flex flex-wrap gap-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="bg-black/20 border border-white/5 rounded-xl w-32 h-12"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Layers className="text-zinc-700" />
                        <div className="h-8 w-48 bg-zinc-800 rounded"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="aspect-[3/4] rounded-xl bg-zinc-900/30 border border-white/5"></div>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
