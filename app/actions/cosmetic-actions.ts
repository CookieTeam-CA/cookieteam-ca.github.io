"use server";

import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { revalidatePath } from "next/cache";
import { accountFetch, accountJson } from "@/lib/cookieapi-account";
import { CapeApiError } from "@/app/cookiecapes/lib/api-error";
import type { AccountActionResult } from "@/app/cookiecapes/lib/account-types";
import type { AccountCosmetics, CosmeticSummary } from "@/app/cookiecapes/lib/cosmetic-types";

async function result<T>(operation: () => Promise<T>): Promise<AccountActionResult<T>> {
  const { t } = await getTranslations();
  try { return { value: await operation() }; }
  catch (error) {
    return { error: error instanceof CapeApiError ? error.message : t("The request could not be completed. Please sign in again or try again later.") };
  }
}

function validId(id: number) {
  if (!Number.isSafeInteger(id) || id < 1) throw new CapeApiError(400, "Invalid cosmetic ID");
  return id;
}

async function send<T>(path: string, method: string, data?: unknown): Promise<T> {
  const response = await accountFetch(path, data === undefined ? { method } : {
    method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  return response.json();
}

export async function loadAccountCosmetics(minecraftUuid: string) {
  return result(() => accountJson<AccountCosmetics>(`/account/cosmetics?minecraft_name=${encodeURIComponent(minecraftUuid)}`));
}

export async function equipCosmetics(minecraftUuid: string, ids: number[]) {
  return result(async () => {
    if (!Array.isArray(ids) || ids.length > 3) throw new CapeApiError(400, "At most 3 cosmetics");
    const value = await send<{ equipped: CosmeticSummary[] }>(`/account/players/${encodeURIComponent(minecraftUuid)}/cosmetics`, "PUT", { cosmetic_ids: ids.map(validId) });
    revalidatePath("/cookiecapes", "layout");
    return value;
  });
}

export async function editCosmetic(id: number, change: { name?: string; shareable?: boolean }) {
  return result(async () => {
    const body = {
      name: typeof change.name === "string" ? change.name : undefined,
      shareable: typeof change.shareable === "boolean" ? change.shareable : undefined,
    };
    const value = await send<CosmeticSummary>(`/account/cosmetics/${validId(id)}`, "PATCH", body);
    revalidatePath("/cookiecapes", "layout");
    return value;
  });
}

export async function deleteCosmetic(id: number) {
  return result(async () => {
    await send(`/account/cosmetics/${validId(id)}`, "DELETE");
    revalidatePath("/cookiecapes", "layout");
  });
}

export async function setPlayerHidden(minecraftUuid: string, target: string, hidden: boolean) {
  const { t } = await getTranslations();
  return result(async () => {
    const name = target.trim();
    if (!/^[A-Za-z0-9_-]{1,36}$/.test(name)) throw new CapeApiError(400, t("Enter a Minecraft name or UUID."));
    return send<{ hidden_players: string[] }>(
      `/account/players/${encodeURIComponent(minecraftUuid)}/hidden_players/${encodeURIComponent(name)}`, hidden ? "PUT" : "DELETE");
  });
}

export async function loadModerationQueue(status: "pending" | "approved" | "rejected" | "all") {
  return result(() => accountJson<{ cosmetics: CosmeticSummary[] }>(`/moderation/cosmetics?status=${encodeURIComponent(status)}`));
}

export async function loadModeratedCosmetic(id: number) {
  return result(() => accountJson<CosmeticSummary>(`/moderation/cosmetics/${validId(id)}`));
}

export async function reviewCosmetic(id: number, approve: boolean) {
  return result(async () => {
    const value = await accountJson<CosmeticSummary>(`/moderation/cosmetics/${validId(id)}/review`, { approve: !!approve });
    revalidatePath("/cookiecapes", "layout");
    return value;
  });
}
