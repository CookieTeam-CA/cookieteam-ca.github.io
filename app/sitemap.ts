import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://cookieattack.de";

  return [
    ...["/cookiecapes", "/cookiecapes/capes", "/cookiecapes/players", "/cookiecapes/rules", "/cookiecapes/tutorial", "/legal-notice", "/privacy-policy"].map(path => ({
      url: `${baseUrl}${path}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...["/stats", "/stats/statistiken", "/stats/punkte", "/stats/spieler", "/stats/achievements"].map(path => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/galerie`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
