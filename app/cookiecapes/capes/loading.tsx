import Footer from "../../components/Footer";

export default function CapesLoading() {
    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 animate-pulse">
                <div className="text-center mb-16">
                    <div className="h-12 w-64 bg-zinc-800 rounded mx-auto mb-4"></div>
                    <div className="h-5 w-96 max-w-full bg-zinc-800 rounded mx-auto"></div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
                    <div className="flex gap-2 w-full md:w-auto overflow-x-hidden">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-24 h-10 bg-zinc-900 border border-white/10 rounded-full shrink-0"></div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden flex flex-col">
                            <div className="w-full aspect-[3/4] bg-[#1a1a1a]"></div>
                            
                            <div className="p-4 bg-zinc-950/50 flex-1 flex flex-col items-center">
                                <div className="w-3/4 h-5 bg-zinc-800 rounded mb-2 mt-1"></div>
                                <div className="w-1/2 h-4 bg-zinc-800 rounded mb-1"></div>
                                
                                <div className="border-t border-white/5 w-full pt-3 mt-4 flex justify-center">
                                    <div className="w-24 h-4 bg-zinc-800 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Footer/>
        </main>
    );
}
