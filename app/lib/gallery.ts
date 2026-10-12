import fs from "fs";
import path from "path";
import { Asset } from "./types";

export function getGalleryAssets(): Asset[] {
  const galleryDir = path.join(process.cwd(), "public", "galerie");
  
  if (!fs.existsSync(galleryDir)) {
    return [];
  }

  const files = fs.readdirSync(galleryDir);
  
  const assets: Asset[] = files
    .filter((file) => /\.(png|jpg|jpeg|webp|mp4)$/i.test(file))
    .map((file, index) => {
      const match = file.match(/^ca(\d+)-/i);
      const randomSeason = Math.floor(Math.random() * 5) + 1;
      const season = match ? parseInt(match[1], 10) : randomSeason;
      
      const type: "image" | "video" = file.toLowerCase().endsWith(".mp4") ? "video" : "image";

      return {
        id: index + 1,
        src: `/galerie/${encodeURIComponent(file)}`,
        type,
        season,
        ...(type === "video" && fs.existsSync(path.join(process.cwd(), "public", "galerie-posters", `${file}.webp`)) ? { poster: `/galerie-posters/${encodeURIComponent(file)}.webp` } : {}),
      };
    })
    .sort((a, b) => a.season - b.season || a.id - b.id);

  return assets;
}

export function getHomeGalleryAssets(): Asset[] {
  const assets = getGalleryAssets();
  // Select on the server so the homepage does not hydrate the entire catalog.
  for (let i = assets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [assets[i], assets[j]] = [assets[j], assets[i]];
  }
  return assets.slice(0, 8);
}
