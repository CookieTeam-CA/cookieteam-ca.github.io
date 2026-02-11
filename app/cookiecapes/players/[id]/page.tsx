import { getPlayer, getCapesByPlayer } from "../../lib/api";
import CapeViewer from "../../components/CapeViewer";
import Link from "next/link";
import { ArrowLeft, User, ShieldAlert, Layers } from "lucide-react";
import Footer from "../../../components/Footer";
import CapeCard from "../../components/CapeCard";

export const revalidate = 60;

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { id } = await params;
    return {
        title: `${id} - Spielerprofil - CookieCapes`,
        description: `Sieh dir das Profil von ${id} auf CookieCapes an.`,
    };
}

export default async function PlayerProfilePage({ params }: PageProps) {
    const { id } = await params;
    
    const [player, createdCapes] = await Promise.all([
        getPlayer(id),
        getCapesByPlayer(id)
    ]);

    if (!player) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
                <h1 className="text-3xl font-bold mb-4">Spieler nicht gefunden</h1>
                <p className="text-zinc-400 mb-8">Dieser Spieler existiert nicht in unserer Datenbank.</p>
                <Link href="/cookiecapes/players" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-all">
                    Zurück zur Liste
                </Link>
            </div>
        );
    }

    const currentCapeUrl = player.current_cape_id 
        ? `/api/proxy?url=${encodeURIComponent(`https://api.cookieattack.de:8989/capes/${player.current_cape_id}.png`)}`
        : null;

    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                
                <Link href="/cookiecapes/players" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Zurück zur Spielerliste
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                    
                    {/* Left Column: Player Preview */}
                    <div className="lg:col-span-1">
                         <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden aspect-[3/4] relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-10" />
                            <div className="w-full h-full flex items-center justify-center">
                                <CapeViewer 
                                    capeUrl={currentCapeUrl}
                                    minecraftName={player.minecraft_name}
                                    animation="walk"
                                />
                            </div>
                            
                            {player.banned && (
                                <div className="absolute top-4 right-4 z-20 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white font-bold border border-red-400/50 flex items-center gap-2 shadow-lg shadow-red-900/20">
                                    <ShieldAlert size={16} />
                                    BANNED
                                </div>
                            )}

                            <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                                <h1 className="text-3xl font-nexa text-white mb-2 truncate">{player.minecraft_name}</h1>
                                {currentCapeUrl ? (
                                    <div className="text-zinc-300 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        Trägt Cape #{player.current_cape_id}
                                    </div>
                                ) : (
                                    <div className="text-zinc-500 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                                        Kein Cape ausgerüstet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <User className="text-orange-500" />
                                Profil Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">UUID</div>
                                    <div className="font-mono text-sm break-all text-zinc-300">{player.minecraft_uuid}</div>
                                </div>
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Erstellte Capes</div>
                                    <div className="font-mono text-xl font-bold text-white">{createdCapes.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Layers className="text-orange-500" />
                        Erstellte Capes
                        <span className="bg-zinc-800 text-zinc-400 text-sm px-2 py-0.5 rounded-full ml-2">
                            {createdCapes.length}
                        </span>
                    </h2>
                    
                    {createdCapes.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {createdCapes.map((cape) => (
                                <CapeCard key={cape.cape_id} cape={cape} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 bg-zinc-900/30 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center text-zinc-500">
                            <Layers size={48} className="opacity-20 mb-4" />
                            <p>Dieser Spieler hat noch keine Capes erstellt.</p>
                        </div>
                    )}
                </div>

            </div>
            <Footer />
        </main>
    );
}
