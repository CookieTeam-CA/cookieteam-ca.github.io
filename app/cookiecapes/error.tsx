"use client";

import { Button } from "@/components/ui/button";

export default function CookieCapesError({ reset }: { reset: () => void }) {
  return <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center" role="alert">
    <h1 className="text-2xl font-bold">Das API-Ergebnis konnte nicht geladen werden.</h1>
    <p className="text-zinc-400">Bitte versuche es erneut.</p>
    <Button size="lg" onClick={reset}>Erneut versuchen</Button>
  </div>;
}
