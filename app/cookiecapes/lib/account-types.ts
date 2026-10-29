import type { Cape } from "./api";
export interface MinecraftProfile { uuid: string; username: string }
export interface AccountInfo {
  user: { id: string; name: string | null };
  links: { minecraft_uuid: string; minecraft_name: string }[];
  mcid_enabled: boolean;
}
export interface OwnedCape extends Omit<Cape, "count" | "cape_image_url"> { is_private: boolean; hidden_at: string | null; delete_after: string | null }
export interface SubmissionQuota { limit: number; used: number; pending: number; remaining: number; resets_at: string }
export interface OwnedCapes {
  quota?: SubmissionQuota;
  capes: OwnedCape[];
  review: { id: string; snapshot: { cape_id: number; revision: number }[] } | null;
}

export type AccountActionResult<T> = { value: T; error?: never } | { error: string; value?: never };
export function actionValue<T>(result: AccountActionResult<T>): T {
  if (result.error !== undefined) throw new Error(result.error);
  return result.value as T;
}
