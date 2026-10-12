"use client";

import Image from "next/image";
import { useState } from "react";
import { UserRound } from "lucide-react";
import dynamic from "next/dynamic";

const SkinPreview = dynamic(() => import("./SkinPreview"), {
  loading: () => <span className="stats-player-visual stats-skin"><span className="stats-skeleton stats-image-skeleton" aria-hidden="true" /></span>,
});

export default function PlayerVisual({ uuid, username, skin = false, size = 36, priority = false, interactive = false }: { uuid?: string; username: string; skin?: boolean; size?: number; priority?: boolean; interactive?: boolean }) {
  const identifier = encodeURIComponent(uuid ?? username);
  return skin ? <SkinPreview key={identifier} identifier={identifier} username={username} interactive={interactive} /> : <PlayerHead key={identifier} identifier={identifier} username={username} size={size} priority={priority} />;
}

function PlayerHead({ identifier, username, size, priority }: { identifier: string; username: string; size: number; priority: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return <span className="stats-player-visual stats-head" style={{ width: size, height: size }}>
    {!loaded && !failed && <span className="stats-skeleton stats-image-skeleton" aria-hidden="true" />}
    {failed ? <UserRound className="stats-image-fallback" aria-label={`Skin von ${username} nicht verfügbar`} /> : <Image
      src={`https://minotar.net/avatar/${identifier}/64`}
      alt=""
      width={size} height={size} unoptimized
      loading={priority ? "eager" : "lazy"} onLoad={() => setLoaded(true)} onError={() => setFailed(true)}
      className={loaded ? "is-loaded" : ""}
    />}
  </span>;
}
