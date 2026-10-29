"use server";

import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { revalidatePath } from "next/cache";
import { accountFetch, accountJson } from "@/lib/cookieapi-account";
import { CapeApiError } from "@/app/cookiecapes/lib/api";
import type { AccountActionResult } from "@/app/cookiecapes/lib/account-types";
import type { AccountInfo, OwnedCapes, MinecraftProfile } from "@/app/cookiecapes/lib/account-types";

async function result<T>(operation: () => Promise<T>): Promise<AccountActionResult<T>> {
  const { t } = await getTranslations();
  try { return { value: await operation() }; }
  catch (error) {
    return { error: error instanceof CapeApiError ? error.message : t("The request could not be completed. Please sign in again or try again later.") };
  }
}

export async function loadAccount() { return accountJson<AccountInfo>("/account/me"); }
export async function loadOwnedCapes(uuid: string) {
  return result(() => accountJson<OwnedCapes>(`/account/capes?minecraft_uuid=${encodeURIComponent(uuid)}`));
}
export async function startMinecraftLink() {
  return result(() => accountJson<{ url: string }>("/account/minecraft/start", {}));
}
export async function completeMinecraftLink(code: string, state: string) {
  return accountJson<{ state: string; profiles: MinecraftProfile[] }>("/account/minecraft/callback", { code, state });
}
export async function selectMinecraftProfiles(state: string, uuids: string[]) {
  return result(async () => {
    await accountJson("/account/minecraft/link", { state, uuids });
    revalidatePath("/cookiecapes/account");
  });
}
export async function reviewLegacyCapes(reviewId: string, keepIds: number[]) {
  return result(async () => {
    await accountJson(`/account/reviews/${encodeURIComponent(reviewId)}`, { keep_ids: keepIds });
    revalidatePath("/cookiecapes", "layout");
  });
}
export async function claimCape(capeId: number, restore = false) {
  const { t } = await getTranslations();
  return result(async () => {
    if (!Number.isSafeInteger(capeId) || capeId < 1) throw new Error(t("Invalid cape ID."));
    await accountJson(restore ? `/me/capes/${capeId}/restore` : `/account/capes/${capeId}/claim`, {});
    revalidatePath("/cookiecapes", "layout");
  });
}
export async function uploadWebsiteCape(form: FormData, replacementId?: number) {
  const { t } = await getTranslations();
  return result(async () => {
    const file = form.get("cape");
    if (!(file instanceof File) || file.size === 0 || file.size > 3 * 1024 * 1024) throw new Error(t("Please choose a PNG file no larger than 3 MB."));
    // Never forward client-supplied verification, owner IDs, or credentials.
    const body = new FormData();
    body.set("cape", file);
    body.set("cape_name", String(form.get("cape_name") ?? ""));
    body.set("minecraft_name", String(form.get("minecraft_uuid") ?? ""));
    body.set("is_private", form.get("is_private") === "true" ? "true" : "false");
    if (replacementId !== undefined && (!Number.isSafeInteger(replacementId) || replacementId <= 1)) throw new Error("Invalid cape ID");
    await accountFetch(replacementId === undefined ? "/web_add_cape" : `/me/capes/${replacementId}/image`, { method: "POST", body });
    revalidatePath("/cookiecapes", "layout");
  });
}

export async function editOwnedCape(capeId: number, operation: "rename" | "visibility" | "delete", value?: string | boolean) {
  return result(async () => {
    if (!Number.isSafeInteger(capeId) || capeId <= 1) throw new Error("Invalid cape ID");
    await accountFetch(`/me/capes/${capeId}`, operation === "delete" ? { method: "DELETE" } : {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(operation === "rename" ? { name: value } : { is_private: value }),
    });
    revalidatePath("/cookiecapes", "layout");
  });
}
