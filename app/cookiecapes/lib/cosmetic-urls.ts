import type { CosmeticSummary } from "./cosmetic-types";

/** Unapproved assets need the website session, so they go through the account proxy. */
export function privateCosmeticUrls(cosmetic: CosmeticSummary): CosmeticSummary {
  if (cosmetic.status === "approved" && !cosmetic.hidden) return cosmetic;
  const base = `/cookiecapes/account/cosmetics/${cosmetic.cosmetic_id}/${cosmetic.revision}`;
  return { ...cosmetic, model_url: `${base}/model.json`, texture_url: `${base}/texture.png`, preview_url: `${base}/preview.png` };
}
