import { getPlayer, getCapesByPlayer, getPlayerHistory } from "../../lib/api";
import CapeViewer from "../../components/CapeViewer";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, User, ShieldAlert, Layers, Globe, MessageCircle, History, Palette, BadgeCheck, Flag, Info } from "lucide-react";
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

function countryCodeToFlag(code: string): string {
    return [...code.toUpperCase()].map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');
}

function countryName(code: string): string {
    try {
        const names = new Intl.DisplayNames(['de'], { type: 'region' });
        return names.of(code.toUpperCase()) || code;
    } catch {
        return code;
    }
}

function socialIcon(type: string) {
    switch (type.toLowerCase()) {
        case 'discord': return <MessageCircle size={16} className="text-[#5865F2]" />;
        case 'twitter': case 'x': return <Globe size={16} className="text-sky-400" />;
        case 'youtube': return <Globe size={16} className="text-red-500" />;
        default: return <Globe size={16} className="text-zinc-400" />;
    }
}

export default async function PlayerProfilePage({ params }: PageProps) {
    const { id } = await params;
    const player = await getPlayer(id);
    const history = await getPlayerHistory(player?.minecraft_name ?? id);

    if (!player && !history) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
                <h1 className="text-3xl font-bold mb-4">Spieler nicht gefunden</h1>
                <p className="text-zinc-400 mb-8">Dieser Spieler existiert nicht.</p>
                <Link href="/cookiecapes/players" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-all">
                    Zurück zur Liste
                </Link>
            </div>
        );
    }

    const displayName = player?.minecraft_name ?? history?.current_username ?? id;
    const createdCapes = player ? await getCapesByPlayer(displayName) : [];
    const currentCapeUrl = player?.current_cape_id 
        ? `/api/proxy?url=${encodeURIComponent(`https://api.cookieattack.de:8989/capes/${player.current_cape_id}.png`)}`
        : null;

    const isCookieCapesUser = !!player;

    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                
                <Link href="/cookiecapes/players" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Zurück zur Spielerliste
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                    <div className="lg:col-span-1">
                         <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden aspect-[3/4] relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-10" />
                            <div className="w-full h-full flex items-center justify-center">
                                <CapeViewer 
                                    capeUrl={currentCapeUrl}
                                    minecraftName={displayName}
                                    animation="walk"
                                />
                            </div>
                            
                            {player?.banned && (
                                <div className="absolute top-4 right-4 z-20 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white font-bold border border-red-400/50 flex items-center gap-2 shadow-lg shadow-red-900/20">
                                    <ShieldAlert size={16} />
                                    BANNED
                                </div>
                            )}

                            <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                                <h1 className="text-3xl font-nexa text-white mb-2 truncate">{displayName}</h1>
                                {isCookieCapesUser ? (
                                    currentCapeUrl ? (
                                        <div className="text-zinc-300 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            Trägt Cape #{player.current_cape_id}
                                        </div>
                                    ) : (
                                        <div className="text-zinc-500 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                                            Kein Cape ausgerüstet
                                        </div>
                                    )
                                ) : (
                                    <div className="text-zinc-500 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                                        Kein CookieCapes Nutzer
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        {!isCookieCapesUser && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-3">
                                <Info size={20} className="text-blue-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-blue-300 font-medium">Dieser Spieler nutzt CookieCapes nicht</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <User className="text-orange-500" />
                                Profil Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">UUID</div>
                                    <div className="font-mono text-sm break-all text-zinc-300">
                                        {player?.minecraft_uuid ?? history?.uuid ?? '—'}
                                    </div>
                                </div>

                                {isCookieCapesUser && (
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                        <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Erstellte Capes</div>
                                        <div className="font-mono text-xl font-bold text-white">{createdCapes.length}</div>
                                    </div>
                                )}

                                {history?.country && (
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                        <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            Land
                                        </div>
                                        <div className="text-lg text-white flex items-center gap-2">
                                            <span className="text-2xl">{countryCodeToFlag(history.country)}</span>
                                            {countryName(history.country)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {history?.socials && history.socials.length > 0 && (
                            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Globe className="text-orange-500" />
                                    Social Media
                                </h2>
                                <div className="flex flex-wrap gap-3">
                                    {history.socials.map((social, i) => (
                                        <div key={i} className="bg-black/20 border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3">
                                            {socialIcon(social.type)}
                                            <div>
                                                <div className="text-xs text-zinc-500 uppercase tracking-wider">{social.type}</div>
                                                <div className="text-white font-medium flex items-center gap-1.5">
                                                    {social.name}
                                                    {social.verified && (
                                                        <BadgeCheck size={14} className="text-blue-400" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {history?.username_history && history.username_history.length > 0 && (
                            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <History className="text-orange-500" />
                                    Namensverlauf
                                </h2>
                                <div className="space-y-1">
                                    {history.username_history.map((entry, i) => (
                                        <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors group">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-2.5 h-2.5 rounded-full ${i === history.username_history.length - 1 ? 'bg-orange-500 ring-2 ring-orange-500/30' : 'bg-zinc-600'}`} />
                                                {i < history.username_history.length - 1 && (
                                                    <div className="w-px h-6 bg-zinc-700/50" />
                                                )}
                                            </div>
                                            <div className="flex-1 flex items-center justify-between">
                                                <span className={`font-mono ${i === history.username_history.length - 1 ? 'text-orange-400 font-bold' : 'text-zinc-300'}`}>
                                                    {entry.username}
                                                </span>
                                                <span className="text-xs text-zinc-500">
                                                    {entry.changed_at 
                                                        ? new Date(entry.changed_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                                        : 'Originalname'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {history?.skin_history && history.skin_history.length > 0 && (
                    <div className="mb-16">
                        <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                            <Palette className="text-orange-500" />
                            Skin Verlauf
                            <span className="bg-zinc-800 text-zinc-400 text-sm px-2 py-0.5 rounded-full ml-2">
                                {history.skin_history.length}
                            </span>
                        </h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                            {[...history.skin_history].reverse().map((skin, i) => (
                                <div key={i} className="group bg-zinc-900/50 border border-white/5 rounded-xl p-3 hover:border-orange-500/30 transition-all hover:scale-105">
                                    <div className="aspect-square relative mb-2 bg-black/30 rounded-lg overflow-hidden flex items-center justify-center">
                                        <Image
                                            src={`https://crafthead.net/avatar/${skin.hash}`}
                                            alt={`Skin ${i + 1}`}
                                            width={64}
                                            height={64}
                                            unoptimized
                                            className="w-full h-full object-contain"
                                            style={{ imageRendering: 'pixelated' }}
                                        />
                                    </div>
                                    <div className="text-[10px] text-zinc-500 text-center truncate">
                                        {new Date(skin.changed_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isCookieCapesUser && (
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
                )}

            </div>
            <Footer />
        </main>
    );
}
