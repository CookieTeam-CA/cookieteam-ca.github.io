import { cookies } from "next/headers";
import { accountFetch } from "@/lib/cookieapi-account";
import { websiteSessionCookie } from "@/lib/cookieapi-adapter";
import { CapeApiError } from "@/app/cookiecapes/lib/api";

export const runtime = "nodejs";
const MAX_BODY = 33 * 1024 * 1024;

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Ungültiger Ursprung." }, { status: 403 });
  if (!(await cookies()).get(websiteSessionCookie)?.value) return Response.json({ error: "Bitte anmelden." }, { status: 401 });
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: "Upload fehlt." }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    await accountFetch("/account/me");
    const deadline = Date.now() + 30000;
    while (true) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const next = reader.read();
      const { done, value } = await Promise.race([next, new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Upload hat zu lange gedauert.")), Math.max(1, deadline - Date.now()));
      })]).finally(() => clearTimeout(timer));
      if (done) break;
      total += value.length;
      if (total > MAX_BODY) { await reader.cancel(); return Response.json({ error: "Maximal 32 MiB pro Upload." }, { status: 413 }); }
      chunks.push(value);
    }
    const form = await new Response(new Blob(chunks as BlobPart[]), { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData();
    const body = new FormData();
    let bytes = 0;
    const files = form.getAll("files");
    if (!files.length || files.length > 200) throw new Error("Bitte 1–200 Frames auswählen.");
    for (const file of files) {
      if (!(file instanceof File) || !file.size) throw new Error("Ungültige Datei.");
      bytes += file.size;
      if (bytes > 32 * 1024 * 1024) throw new Error("Maximal 32 MiB pro Upload.");
      body.append("files", file);
    }
    for (const key of ["minecraft_name", "cape_name", "options", "is_private", "replacement"]) {
      const value = form.get(key);
      if (typeof value === "string") body.set(key, value);
    }
    const response = await accountFetch("/animations/submissions", { method: "POST", body });
    return Response.json(await response.json(), { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    await reader.cancel().catch(() => {});
    return Response.json({ error: error instanceof Error ? error.message : "Upload fehlgeschlagen." }, { status: error instanceof CapeApiError ? error.status : 400 });
  }
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[a-f0-9]{32}$/.test(id)) return Response.json({ error: "Ungültiger Auftrag." }, { status: 400 });
  try {
    const response = await accountFetch(`/animations/submissions/${id}`);
    return Response.json(await response.json(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Status nicht verfügbar." }, { status: error instanceof CapeApiError ? error.status : 401 });
  }
}
