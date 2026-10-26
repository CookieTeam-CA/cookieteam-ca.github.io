"use client";

import { Button } from "@/components/ui/button";

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
        <Button size="lg"
          onClick={reset}
        >
          Erneut versuchen
        </Button>

        <Button asChild variant="outline" size="lg"><Link href="/">
            Zurück zur Startseite
        </Link></Button>
      </div>
    </div>
  );
}
