"use client";

import { useState, useEffect, useRef } from "react";
import { login, logout } from "../actions/auth-actions";
import { checkRegistration, registerUser, unregisterUser, verifyMinecraftAccount } from "../actions/user-registration-actions";
import CapeViewer from "../cookiecapes/components/CapeViewer";
import { Session } from "next-auth";

export default function SetupWizard({ session }: { session: Session | null }) {
  const [step, setStep] = useState(0);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [mcName, setMcName] = useState("");
  const [mcUuid, setMcUuid] = useState("");
  const [capeUrl, setCapeUrl] = useState<string | null>(null);
  const [mcError, setMcError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [rulesAccepted, setRulesAccepted] = useState(false);
  const wizardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isReturning = typeof window !== "undefined" && sessionStorage.getItem("discord_login_scroll") === "true";
    if (isReturning) {
      setTimeout(() => {
        wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 800);
    }
  }, []);

  useEffect(() => {
    if (session) {
      checkRegistration().then(res => {
        setIsRegistered(res.registered);
        
        const isReturning = typeof window !== "undefined" && sessionStorage.getItem("discord_login_scroll") === "true";
        if (isReturning) {
          sessionStorage.removeItem("discord_login_scroll");
        }

        if (res.registered) {
          setStep(10);
        } else if (isReturning) {
          setStep(2);
        }
      });
    } else {
      const isReturning = typeof window !== "undefined" && sessionStorage.getItem("discord_login_scroll") === "true";
      if (isReturning) {
        sessionStorage.removeItem("discord_login_scroll");
      }
    }
  }, [session]);

  const handleStart = () => {
    if (session && isRegistered === false) {
      setStep(2);
    } else {
      setStep(1);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("discord_login_scroll", "true");
    }
    await login();
  };

  const handleMcVerify = async (name: string) => {
    if (!name || name.length < 3) return;
    setIsLoading(true);
    setMcError("");
    const res = await verifyMinecraftAccount(name);
    setIsLoading(false);
    
    if (res.success) {
      setMcUuid(res.uuid!);
      const rawCape = res.capeUrl || null;
      setCapeUrl(rawCape ? `/api/proxy?url=${encodeURIComponent(rawCape)}` : null);
    } else {
      setMcError(res.error || "Fehler aufgetreten");
      setMcUuid("");
      setCapeUrl(null);
    }
  };

  const handleMcNameChange = (value: string) => {
    setMcName(value);
    setMcUuid("");
    setCapeUrl(null);
    setMcError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length >= 3) {
      debounceRef.current = setTimeout(() => handleMcVerify(value), 600);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    const res = await registerUser(mcUuid);
    setIsLoading(false);
    
    if (res.success) {
      setStep(5);
    } else {
      alert("Fehler bei der Registrierung: " + res.error);
    }
  };

  const handleUnregister = async () => {
    if (confirm("Möchtest du dich wirklich von CookieAttack 6 abmelden?")) {
      setIsLoading(true);
      const res = await unregisterUser();
      setIsLoading(false);
      
      if (res.success) {
        setIsRegistered(false);
        setStep(0);
        setMcUuid("");
        setMcName("");
      } else {
        alert("Fehler beim Abmelden: " + res.error);
      }
    }
  };

  return (
    <div ref={wizardRef} className="relative w-full max-w-4xl mx-auto my-12 px-6">

      
      <div className="relative z-10 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl transition-all duration-500 overflow-hidden min-h-112.5 flex flex-col items-center justify-center">
        {step === 0 && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl md:text-5xl font-nexa text-white mb-6">
              Bereit für <span className="text-orange-500">Cookie</span>Attack 6?
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto mb-10 text-lg">
              Registriere dich jetzt, um direkt beim Start spielen zu können!
            </p>
            <button 
              onClick={handleStart}
              className="group relative overflow-hidden rounded-full bg-orange-500 px-10 py-4 font-bold text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span className="relative z-10">Jetzt Registrieren</span>
              <div className="absolute inset-0 -z-10 translate-y-full bg-orange-600 transition-transform duration-300 group-hover:translate-y-0"></div>
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-md">
            <div className="w-16 h-16 rounded-full bg-[#5865F2]/20 flex items-center justify-center mx-auto mb-6 text-[#5865F2]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-14.36a.074.074 0 0 0-.032-.027zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Discord Verknüpfung</h3>
            <p className="text-zinc-400 mb-8">Wir benötigen deinen Discord Account, um dich mit deinem Discord Account zu verknüpfen.</p>
            
            {session ? (
              <div className="flex flex-col gap-4">
                <div className="bg-zinc-800/50 rounded-xl p-4 flex items-center gap-4 border border-white/5">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-700">
                    {session.user?.image && <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />}
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-zinc-400">Angemeldet als</div>
                    <div className="font-bold text-white">{session.user?.name}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  className="w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white transition-all hover:bg-orange-600 active:scale-[0.98] cursor-pointer"
                >
                  Weiter
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#5865F2] py-3.5 font-bold text-white transition-all hover:bg-[#4752C4] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Lade..." : "Mit Discord anmelden"}
              </button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-3xl animate-in fade-in slide-in-from-right-8 duration-500">
            <h3 className="text-3xl font-bold text-white mb-2 text-center">Minecraft Account</h3>
            <p className="text-zinc-400 mb-8 text-center">Bitte gib deinen genauen Minecraft ein.</p>
            
            <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-2 mb-6">
                  <label className="text-sm font-medium text-zinc-300">Minecraft Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={mcName}
                      onChange={(e) => handleMcNameChange(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                      placeholder="z.B. LeonMT3"
                      autoFocus
                    />
                    {isLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                      </div>
                    )}
                    {mcUuid && !isLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {mcError && <span className="text-red-400 text-sm mt-1">{mcError}</span>}
                  {!mcUuid && !mcError && mcName.length < 3 && mcName.length > 0 && (
                    <span className="text-zinc-500 text-sm">Mindestens 3 Zeichen eingeben…</span>
                  )}
                </div>

                {mcUuid ? (
                   <button 
                    onClick={() => setStep(3)}
                    className="w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white transition-all hover:bg-orange-600 active:scale-[0.98] cursor-pointer"
                   >
                     Das bin ich! Weiter
                   </button>
                ) : (
                  <div className="text-sm text-zinc-500 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                    Gib deinen genauen Ingame-Namen ein. Mit einem falschen Namen kannst du nicht auf den Server joinen.
                  </div>
                )}
              </div>
              
              <div className="w-full md:w-52 h-90 shrink-0 bg-zinc-900/80 rounded-2xl border border-white/10 overflow-hidden relative">
                {mcUuid ? (
                  <CapeViewer minecraftName={mcName} capeUrl={capeUrl} animation="walk" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 gap-3">
                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs text-zinc-600">Skin Vorschau</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center animate-in fade-in slide-in-from-right-8 duration-500 w-full max-w-lg">
            <h3 className="text-3xl font-bold text-white mb-6">Regeln & Bedingungen</h3>
            
            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 text-left mb-6 h-50 overflow-y-auto text-sm text-zinc-300 space-y-4 custom-scrollbar">
              <p className="font-semibold text-white border-b border-white/10 pb-1">Allgemeine Regeln</p>
              <p><strong>1. Respektvolles Miteinander:</strong> Keine Diskriminierung oder Beleidigungen gegenüber anderen (außer in beiderseitigem, klar erkennbarem, humorvollem Kontext. Bei Zweifeln entscheidet das Team).</p>
              <p><strong>2. Sprachaufzeichnung:</strong> Mit dem Betreten des Servers akzeptierst du, dass deine Stimme beim Nutzen des Voicechats ggf. aufgezeichnet werden kann.</p>
              <p><strong>3. Verbotene Inhalte:</strong> Rassistische, extremistische, sexistische und pornografische Inhalte sind strengstens verboten.</p>
              <p><strong>4. Verhalten & Belästigung:</strong> Provokatives oder unangemessenes Verhalten ist zu vermeiden. Sexuelle, körperliche oder aufdringliche Belästigung ist untersagt. Sei kein Arsch!</p>
              <p><strong>5. Team-Vorbehalt:</strong> Wir nehmen uns das Recht heraus, jemanden zu bestrafen, ohne dass es einen expliziten Regelbruch gab, falls die Person etwas getan hat, was wir als unangemessen empfinden.</p>

              <p className="font-semibold text-white border-b border-white/10 pt-2 pb-1">Chat- & Voice-Regeln</p>
              <p><strong>6. Spam & Falschinformationen:</strong> Kein übermäßiger Spam und keine Verbreitung von Falschinformationen.</p>
              <p><strong>7. Soundboards & Störgeräusche:</strong> Soundboards sind erlaubt – wenn Mitspieler sich genervt fühlen, müsst ihr jedoch aufhören. Vermeide störende Hintergrundgeräusche (Musik, Essen, Videos etc.). Nutze im Zweifel Push-to-Talk.</p>
              <p><strong>8. Mikrofon-Nutzung:</strong> Nutze das Mikrofon nicht, um andere Nutzer bewusst zu belästigen oder zu provozieren.</p>

              <p className="font-semibold text-white border-b border-white/10 pt-2 pb-1">Spielregeln</p>
              <p><strong>9. Server-Performance:</strong> Lag-Maschinen und andere Methoden, die den Server zum Laggen bringen könnten, sind untersagt.</p>
              <p><strong>10. PvP & Fairplay:</strong> Random PvP ohne Kontext ist unerwünscht. PvP sollte fair und nachvollziehbar sein. Wenn du jemanden tötest, sei fair und gib ihm einen Teil seines Loots zurück – wir wollen niemandem den Spielspaß versauen! Bei Streitfällen entscheidet das Team.</p>
              <p><strong>11. Hacking & Duplizieren:</strong> Hacking (Kill-Aura, X-Ray, etc.) ist verboten. Duplikations-Maschinen für das Drachenei oder Maschinen, die jeden beliebigen Block duplizieren können, sind untersagt.</p>
              <p><strong>12. Accounts & Claims:</strong> Pro Spieler ist nur ein Account erlaubt (Verdacht auf Multiaccounting führt zu Maßnahmen). Es ist verboten, geclaimte Bereiche mit eigenen Claims zu umrunden.</p>

              <p className="font-semibold text-white border-b border-white/10 pt-2 pb-1">Mod-Regeln</p>
              <p><strong>13. Erlaubte Mods:</strong> Clientseitige Freecam-Mods (z. B. für Cinematic-Aufnahmen) sind erlaubt, solange keine X-Ray- oder Wallhack-Funktion aktiv ist und man nicht durch solide Blöcke sehen oder fliegen kann.</p>

              <p className="font-semibold text-white border-b border-white/10 pt-2 pb-1">Bestrafungen</p>
              <p>Bei Regelverstößen behält sich das Team vor, entsprechende Maßnahmen (temporärer oder permanenter Ausschluss) zu ergreifen – je nach Schwere des Verstoßes.</p>
              <p>Die Regeln können sich jederzeit ändern, die neuste Version ist immer auf den Discord Server zu finden!</p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group mb-8 text-left">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  className="peer appearance-none w-6 h-6 border-2 border-zinc-600 rounded-md checked:bg-orange-500 checked:border-orange-500 transition-all cursor-pointer"
                  checked={rulesAccepted}
                  onChange={(e) => setRulesAccepted(e.target.checked)}
                />
                <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-zinc-300 group-hover:text-white transition-colors select-none">
                Ich habe die Regeln gelesen und akzeptiere sie vollständig.
              </span>
            </label>

            <button 
              onClick={() => setStep(4)}
              disabled={!rulesAccepted}
              className="w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white transition-all hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Weiter
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center animate-in fade-in slide-in-from-right-8 duration-500 w-full max-w-md">
            <h3 className="text-3xl font-bold text-white mb-2">Fast geschafft!</h3>
            <p className="text-zinc-400 mb-8">Stelle sicher, dass du auf unserem Discord Server bist, damit du keine Ankündigungen verpasst.</p>
            
            <a 
              href="https://dc.cookieattack.de" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#5865F2] py-4 font-bold text-white transition-all hover:bg-[#4752C4] hover: active:scale-95 mb-6"
            >
               Discord Server beitreten
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
               </svg>
            </a>

            <div className="relative flex items-center py-5">
                <div className="grow border-t border-zinc-800"></div>
                <span className="shrink-0 mx-4 text-zinc-500 text-sm">und dann</span>
                <div className="grow border-t border-zinc-800"></div>
            </div>

            <button 
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full rounded-xl bg-orange-500 py-4 font-bold text-white transition-all hover:bg-orange-600 hover: hover:shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Wird registriert..." : "Registrierung abschließen"}
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="text-center animate-in zoom-in-95 duration-700">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 text-green-500 border border-green-500/30">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-4xl font-nexa text-white mb-4">Erfolgreich Registriert!</h2>
            <p className="text-zinc-400 max-w-md mx-auto text-lg mb-8">
              Willkommen bei CookieAttack 6, <span className="text-white font-medium">{mcName}</span>! Wir freuen uns auf dich. Weitere Infos folgen auf dem Discord.
            </p>
            <div className="flex justify-center gap-4">
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="rounded-full bg-zinc-800 hover:bg-zinc-700 px-8 py-3 font-medium text-white transition-all border border-white/10 cursor-pointer"
                >
                  Zurück nach oben
                </button>
            </div>
          </div>
        )}
        
        {step === 10 && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-6 text-orange-500">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-nexa text-white mb-4">Du bist bereits dabei!</h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-8">
              Dein Account ist bereits für CookieAttack 6 registriert. Wir freuen uns bereits auf dich!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href="https://dc.cookieattack.de" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#5865F2] hover:bg-[#4752C4] px-8 py-3 font-medium text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Discord Server
                </a>
                <button 
                  onClick={handleUnregister}
                  disabled={isLoading}
                  className="rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 px-8 py-3 font-medium transition-all border border-red-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? "Bitte warten..." : "Abmelden"}
                </button>
            </div>
          </div>
        )}

      </div>
      
      {step > 0 && step < 5 && step !== 10 && (
         <div className="flex justify-center gap-2 mt-8">
           {[1, 2, 3, 4].map((i) => (
             <div 
               key={i} 
               className={`h-1.5 rounded-full transition-all duration-500 ${
                 i === step ? "w-8 bg-orange-500" : i < step ? "w-4 bg-orange-500/50" : "w-4 bg-zinc-800"
               }`}
             />
           ))}
         </div>
      )}
    </div>
  );
}
