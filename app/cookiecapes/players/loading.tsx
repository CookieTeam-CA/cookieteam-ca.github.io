export default function Loading() {
    return (
        <div className="w-full min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                     <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                        <span className="text-orange-500 font-bold text-xl">P</span>
                     </div>
                </div>
                <p className="text-zinc-500 animate-pulse">Lade Spieler...</p>
            </div>
        </div>
    );
}
