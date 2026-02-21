import { getCape, getPlayersByCape } from "../../lib/api";
import CapeViewer from "../../components/CapeViewer";
import Link from "next/link";
import { ArrowLeft, User, Calendar, Hash, Users } from "lucide-react";
import Footer from "../../../components/Footer";

export const revalidate = 60;

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { id } = await params;
    const cape = await getCape(Number(id));
    
    if (!cape) {
        return {
            title: "Cape nicht gefunden - CookieCapes",
        };
    }

    return {
        title: `${cape.cape_name} - CookieCapes`,
        description: `Sieh dir das Cape "${cape.cape_name}" von ${cape.minecraft_name} an.`,
    };
}

export default async function CapeDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const capeId = Number(id);
    
    const [cape, players] = await Promise.all([
        getCape(capeId),
        getPlayersByCape(capeId)
    ]);

    if (!cape) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
                <h1 className="text-3xl font-bold mb-4">Cape nicht gefunden</h1>
                <p className="text-zinc-400 mb-8">Das gesuchte Cape existiert nicht oder wurde gelöscht.</p>
                <Link href="/cookiecapes/capes" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-all">
                    Zurück zur Galerie
                </Link>
            </div>
        );
    }

    const capeUrl = `/api/proxy?url=${encodeURIComponent(`https://api.cookieattack.de:8989/capes/${cape.cape_id}.png`)}`;

    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                
                <Link href="/cookiecapes/capes" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Zurück zur Galerie
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden aspect-[4/3] relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-10" />
                            <div className="w-full h-full flex items-center justify-center">
                                <CapeViewer 
                                    capeUrl={capeUrl}
                                    minecraftName={cape.minecraft_name}
                                    animation="walk"
                                />
                            </div>
                            <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                                <h1 className="text-3xl md:text-5xl font-nexa text-white mb-2">{cape.cape_name}</h1>
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={`https://minotar.net/avatar/${cape.minecraft_name}/32`} 
                                        alt={cape.minecraft_name} 
                                        className="w-8 h-8 rounded"
                                    />
                                    <div className="text-zinc-300">
                                        Erstellt von <span className="text-white font-bold">{cape.minecraft_name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cape Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                <Hash className="text-orange-500 mb-2" size={20} />
                                <span className="text-zinc-400 text-xs uppercase tracking-wider mb-1">ID</span>
                                <span className="text-xl font-mono font-bold">{cape.cape_id}</span>
                            </div>
                            <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                <Users className="text-orange-500 mb-2" size={20} />
                                <span className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Nutzer</span>
                                <span className="text-xl font-bold">{players.length}</span>
                            </div>
                             <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                <Calendar className="text-orange-500 mb-2" size={20} />
                                <span className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Zuletzt aktualisiert</span>
                                <span className="text-sm font-medium">{new Date(cape.last_edited).toLocaleDateString()}</span>
                            </div>
                            {/* Placeholder for potential other stats */}
                            <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                <User className="text-orange-500 mb-2" size={20} />
                                <span className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Author</span>
                                <span className="text-sm font-medium truncate w-full">{cape.minecraft_name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Active Users */}
                    <div className="lg:col-span-1">
                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 h-full flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Users className="text-orange-500" size={20} />
                                Aktive Nutzer
                                <span className="bg-orange-500/10 text-orange-400 text-xs px-2 py-1 rounded-full ml-auto font-mono">
                                    {players.length}
                                </span>
                            </h3>

                            {players.length > 0 ? (
                                <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                                    {players.map((player) => (
                                        <div key={player.minecraft_uuid} className="bg-black/30 border border-white/5 rounded-lg p-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                                            <img 
                                                src={`https://minotar.net/helm/${player.minecraft_name}/32`} 
                                                alt={player.minecraft_name} 
                                                className="w-8 h-8 rounded"
                                            />
                                            <span className="font-medium text-zinc-200">{player.minecraft_name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                                    <Users size={48} className="opacity-20 mb-4" />
                                    <p>Niemand trägt dieses Cape aktuell.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
            <Footer />
        </main>
    );
}
