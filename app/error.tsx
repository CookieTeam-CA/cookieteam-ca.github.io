"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] text-white p-6 text-center">
      <h1 className="font-nexa text-[4rem] md:text-[6rem] leading-none mb-4 text-orange-500">
        OOPS!
      </h1>
      
      <h2 className="font-nexa text-2xl md:text-3xl mb-6">
        Da ist etwas schiefgelaufen.
      </h2>
      
      <p className="text-zinc-400 max-w-lg mb-10">
        Ein unerwarteter Fehler ist aufgetreten. Wir arbeiten daran!
      </p>
      
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={reset}
          className="px-8 py-3.5 rounded-full border border-orange-500 bg-orange-500/10 text-orange-500 font-bold hover:bg-orange-500 hover:text-white transition-all hover:scale-105 active:scale-95"
        >
          Erneut versuchen
        </button>

        <Link 
            href="/"
            className="px-8 py-3.5 rounded-full border border-white/20 bg-white/5 text-white font-bold hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
        >
            Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
}
