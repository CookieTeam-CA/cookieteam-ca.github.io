import { cookies } from "next/headers";
import { accountFetch } from "@/lib/cookieapi-account";
import { websiteSessionCookie } from "@/lib/cookieapi-config";
import { CapeApiError } from "@/app/cookiecapes/lib/api-error";
import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { COSMETIC_SLOTS, type CosmeticSlot } from "@/app/cookiecapes/lib/cosmetic-types";

export const runtime = "nodejs";
const MAX_FILE = 4 * 1024 * 1024;
const MAX_BODY = 2 * MAX_FILE + 1024 * 1024;

// Model plus texture can exceed the server-action body limit, so uploads stream through a route.
export async function POST(request: Request) {
  const { t } = await getTranslations();
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: t("Invalid origin.") }, { status: 403 });
  if (!(await cookies()).get(websiteSessionCookie)?.value) return Response.json({ error: t("Please sign in.") }, { status: 401 });
  const tooLarge = () => Response.json({ error: t("Model and texture may be at most 4 MiB each.") }, { status: 413 });
  if (Number(request.headers.get("content-length")) > MAX_BODY) return tooLarge();
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: t("The upload is missing.") }, { status: 400 });
  try {
    const chunks: Uint8Array[] = [];
    let total = 0;
    const deadline = Date.now() + 30000;
    while (true) {
      if (Date.now() > deadline) throw new Error(t("The upload timed out."));
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BODY) { await reader.cancel(); return tooLarge(); }
      chunks.push(value);
    }
    const form = await new Response(new Blob(chunks as BlobPart[]), { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData();
    const slot = String(form.get("slot") ?? "");
    if (!COSMETIC_SLOTS.includes(slot as CosmeticSlot)) throw new Error(t("Choose a cosmetic type."));
    // Forward only the expected fields; never client-supplied identities or credentials.
    const body = new FormData();
    for (const key of ["minecraft_name", "name", "slot", "particles"]) {
      const value = form.get(key);
      if (typeof value === "string") body.set(key, value);
    }
    body.set("shareable", form.get("shareable") === "true" ? "true" : "false");
    for (const key of ["model", "texture"]) {
      const file = form.get(key);
      if (file instanceof File && file.size) {
        if (file.size > MAX_FILE) return tooLarge();
        body.set(key, file);
      }
    }
    const response = await accountFetch("/cosmetics/submissions", { method: "POST", body });
    return Response.json(await response.json(), { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    await reader.cancel().catch(() => {});
    return Response.json({ error: error instanceof Error ? error.message : t("Upload failed.") }, { status: error instanceof CapeApiError ? error.status : 400 });
  }
}
