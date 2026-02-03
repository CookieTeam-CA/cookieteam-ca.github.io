"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import gsap from "gsap";
import { uploadCape } from "../actions";
import CapeViewer from "./CapeViewer";
import { Bold } from "lucide-react";

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [minecraftName, setMinecraftName] = useState("");
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [capeName, setCapeName] = useState("");
  const [capeFile, setCapeFile] = useState<File | null>(null);
  const [capePreviewUrl, setCapePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success?: boolean; error?: string; capeId?: number } | null>(null);
  const [reachedLimit, setReachedLimit] = useState(false);
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [playerAvatar, setPlayerAvatar] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (document.cookie.includes("cape_upload_limit=true")) {
        setReachedLimit(true);
    }
  }, []);

  useEffect(() => {
    if (contentRef.current) {
        gsap.fromTo(contentRef.current, 
            { opacity: 0, x: 20 },
            { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }
        );
    }
  }, [step]);

  useEffect(() => {
    return () => {
      if (capePreviewUrl) URL.revokeObjectURL(capePreviewUrl);
    };
  }, [capePreviewUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "image/png") {
          setCapeFile(file);
          const url = URL.createObjectURL(file);
          setCapePreviewUrl(url);
      } else {
          alert("Bitte lade nur PNG Dateien hoch!");
      }
    }
  };

  const validateMinecraftName = async () => {
      setIsValidating(true);
      setValidationError(null);
      setPlayerAvatar(null);

      try {
          const response = await fetch(`https://playerdb.co/api/player/minecraft/${minecraftName}`);
          const data = await response.json();

          if (data.success) {
              setPlayerAvatar(data.data.player.avatar);
              return true;
          } else {
              setValidationError("Dieser Minecraft Name existiert nicht.");
              return false;
          }
      } catch (error) {
          setValidationError("Fehler bei der Überprüfung. Bitte versuche es später erneut.");
          return false;
      } finally {
          setIsValidating(false);
      }
  };

  const handleNext = async () => {
      if (step === 1) {
          const isValid = await validateMinecraftName();
          if (isValid) {
              setStep(prev => prev + 1);
          }
      } else {
          setStep(prev => prev + 1);
      }
  };

  const handleUpload = async () => {
    if (!capeFile || !minecraftName || !capeName) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("minecraft_name", minecraftName);
    formData.append("cape_name", capeName);
    formData.append("cape", capeFile);

    const result = await uploadCape(null, formData);
    setIsUploading(false);
    setUploadResult(result);
    setStep(6);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-20">
        <h2 className="font-nexa text-3xl md:text-5xl text-white text-center mb-12">
            Cape <span className="text-orange-500">Erstellen</span>
        </h2>

        <div className="max-w-2xl mx-auto bg-zinc-900/50 border border-white/10 rounded-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                <div 
                    className="h-full bg-orange-500 transition-all duration-500 ease-out"
                    style={{ width: `${(step / 6) * 100}%` }}
                />
            </div>

            <div ref={contentRef} className="min-h-[300px] flex flex-col justify-center">
                {step === 1 && (
                    <div className="flex flex-col gap-6">
                        <h3 className="text-2xl font-bold text-white">Schritt 1: Minecraft Name</h3>
                        <p className="text-zinc-400">Schreibe deinen Minecraft Name, damit das Cape dir zugeordnet werden kann.</p>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Dein Minecraft Name (z.B. Notch)"
                                className={`w-full bg-black/50 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${validationError ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-orange-500'}`}
                                value={minecraftName}
                                onChange={(e) => {
                                    setMinecraftName(e.target.value);
                                    setValidationError(null);
                                }}
                                disabled={reachedLimit || isValidating}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && minecraftName.length >= 3 && !reachedLimit && !isValidating) {
                                        handleNext();
                                    }
                                }}
                            />
                            {isValidating && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        
                        {validationError && (
                             <p className="text-red-500 text-sm mt-[-10px]">{validationError}</p>
                        )}

                         {reachedLimit && (
                             <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500 text-sm">
                                 Du hast heute bereits ein Cape hochgeladen. Bitte versuche es morgen erneut.
                             </div>
                         )}
                         <button 
                            disabled={minecraftName.length < 3 || reachedLimit || isValidating}
                            onClick={handleNext}
                            className="mt-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center"
                        >
                            {isValidating ? "Überprüfe..." : "Weiter"}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col gap-6">
                        <h3 className="text-2xl font-bold text-white">Schritt 2: Regeln</h3>
                        <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-sm text-zinc-300 space-y-2">
                            <p>1. Keine anstößigen, rassistischen oder illegalen Inhalte.</p>
                            <p>2. Keine Urheberrechtsverletzungen.</p>
                            <p>3. Missbrauch führt zum Bann vom Cape-System.</p>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${acceptedRules ? 'bg-orange-500 border-orange-500' : 'border-zinc-500 group-hover:border-white'}`}>
                                {acceptedRules && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <input 
                                type="checkbox" 
                                className="hidden"
                                checked={acceptedRules}
                                onChange={(e) => setAcceptedRules(e.target.checked)}
                            />
                            <span className="text-white">Ich akzeptiere die <a href="/cookiecapes/rules" target="_blank" className="text-orange-500 hover:underline">Regeln</a>.</span>
                        </label>
                        <button 
                            disabled={!acceptedRules}
                            onClick={handleNext}
                            className="mt-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all"
                        >
                            Weiter
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col gap-6">
                        <h3 className="text-2xl font-bold text-white">Schritt 3: Cape Name</h3>
                        <p className="text-zinc-400">Gib deinem Cape einen Namen, diesen kannst du später nicht mehr ändern und jeder kann ihn sehen.</p>
                        <input 
                            type="text" 
                            placeholder="Cape Name (z.B. Super Cape)"
                            className="bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none transition-colors"
                            value={capeName}
                            onChange={(e) => setCapeName(e.target.value)}
                        />
                        <button 
                            disabled={capeName.length < 2}
                            onClick={handleNext}
                            className="mt-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all"
                        >
                            Weiter
                        </button>
                    </div>
                )}

                {step === 4 && (
                    <div className="flex flex-col gap-6">
                        <h3 className="text-2xl font-bold text-white">Schritt 4: Bild Hochladen</h3>
                        <p className="text-zinc-400">Lade dein Cape Bild (PNG) hoch. Es sollte das Standard Minecraft Cape Format haben Vorlage dafür gibt es auf der <a href="/cookiecapes/tutorial" target="_blank" className="text-orange-500 hover:underline">Tutorial</a> Seite.</p>
                        
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-blue-100">
                                Weißt du nicht wie man ein Cape erstellt? <a href="/cookiecapes/tutorial" target="_blank" className="text-blue-400 hover:underline font-medium">Schau dir das Tutorial an.</a>
                            </p>
                        </div>

                        <div className="relative border-2 border-dashed border-zinc-700 hover:border-orange-500 rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-colors bg-black/20 cursor-pointer">
                            <input 
                                type="file" 
                                accept="image/png"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <svg className="w-12 h-12 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span className="text-zinc-400 font-medium">Klicken oder Datei hierher ziehen</span>
                        </div>

                        {capeFile && (
                            <div className="text-green-400 text-sm text-center">
                                Ausgewählt: {capeFile.name}
                            </div>
                        )}

                        <button 
                            disabled={!capeFile}
                            onClick={handleNext}
                            className="mt-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all"
                        >
                            Weiter zur Vorschau
                        </button>
                    </div>
                )}

                 {step === 5 && (
                    <div className="flex flex-col gap-6 items-center">
                        <h3 className="text-2xl font-bold text-white">Schritt 5: Vorschau</h3>
                        <p className="text-zinc-400 text-center">Überprüfe ob das Cape richtig angezeigt wird und ob es überhaupt sichtbar ist.<br/> Sollte alles gut aussehen klicke auf "Hochladen".</p>
                        
                        <div className="w-full max-w-[300px] h-[400px]">
                            <CapeViewer 
                                capeUrl={capePreviewUrl}
                                skinUrl={`https://minotar.net/skin/${minecraftName}`}
                            />
                        </div>

                         <div className="flex gap-4 w-full">
                            <button 
                                onClick={() => setStep(4)}
                                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 rounded-lg transition-all"
                            >
                                Zurück
                            </button>
                            <button 
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Laden...
                                    </>
                                ) : (
                                    "Hochladen"
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {step === 6 && uploadResult && (
                    <div className="flex flex-col gap-6 items-center text-center">
                        {uploadResult.success ? (
                            <>
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-4">
                                     <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h3 className="text-3xl font-bold text-white">Erfolg!</h3>
                                <p className="text-zinc-300">Cape erfolgreich hochgeladen.</p>
                                <p className="text-zinc-400 text-sm">Cape ID: <span className="text-orange-500 font-mono">{uploadResult.capeId}</span></p>
                                <button 
                                    onClick={() => {
                                        setStep(1);
                                        setCapeFile(null);
                                        setCapeName("");
                                        setMinecraftName("");
                                        setUploadResult(null);
                                        setAcceptedRules(false);
                                        setPlayerAvatar(null);
                                    }}
                                    className="mt-8 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
                                >
                                    Neues Cape hochladen
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-4">
                                     <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                                <h3 className="text-3xl font-bold text-white">Fehler</h3>
                                <p className="text-red-400">{uploadResult.error}</p>
                                <button 
                                    onClick={() => setStep(4)}
                                    className="mt-8 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
                                >
                                    Erneut versuchen
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
