export default function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": "CookieTeam",
    "description": "Das ultimative Minecraft Erlebnis. Minecraft Projekt und Community.",
    "genre": ["Roleplay", "Adventure", "Sandbox"],
    "gamePlatform": "PC",
    "applicationCategory": "Game",
    "url": "https://cookieattack.de",
    "image": "https://cookieattack.de/opengraph-image.png",
    "author": {
      "@type": "Organization",
      "name": "CookieTeam",
      "url": "https://cookieattack.de"
    },
    "keywords": "Minecraft, Server, Roleplay, German, Event"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}