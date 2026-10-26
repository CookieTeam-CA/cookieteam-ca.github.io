"use client";

import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="stats-empty" role="alert"><h1>Die Statistiken sind gerade nicht erreichbar.</h1><p>Die API-Daten konnten nicht vollständig geladen werden. Bitte versuche es erneut.</p><Button className="mt-5" onClick={reset}>Erneut versuchen</Button></div>; }
