import "server-only";
import { cache } from "react";
import { accountJson } from "@/lib/cookieapi-account";
import { CapeApiError, getCape, type Cape } from "./api";
import type { AccountInfo, OwnedCape } from "./account-types";

// Request-local reuse between page metadata and content; owner data stays server-side.
export const getCapeForDetails = cache(async (id: number): Promise<(Cape & { is_private?: boolean }) | null> => {
  if (!Number.isSafeInteger(id) || id < 0) return null;
  try {
    const cape = await getCape(id);
    if (cape) return cape;
  } catch (error) {
    if (!(error instanceof CapeApiError) || ![401, 403, 404].includes(error.status)) throw error;
  }
  try {
    const account = await accountJson<AccountInfo>("/account/me");
    for (const link of account.links) {
      const { capes } = await accountJson<{ capes: OwnedCape[] }>(`/me/capes?minecraft_uuid=${encodeURIComponent(link.minecraft_uuid)}`);
      const cape = capes.find(cape => cape.cape_id === id && !cape.hidden_at);
      if (cape) return { ...cape, animation: cape.animation ? { ...cape.animation, manifest_url: `/cookiecapes/account/animation/${id}/manifest.json` } : undefined, count: 0, cape_image_url: `/cookiecapes/account/images/${id}?v=${encodeURIComponent(cape.last_edited ?? "")}` };
    }
  } catch (error) {
    if (error instanceof CapeApiError && ![401, 403, 404].includes(error.status)) throw error;
  }
  return null;
});
