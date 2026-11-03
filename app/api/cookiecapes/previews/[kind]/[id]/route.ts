import { renderPreview } from "@/app/cookiecapes/lib/preview-renderer";
import { playerTextures, PreviewError, publicCapeTexture, publicAnimation } from "@/app/cookiecapes/lib/preview-source";
import { renderAnimationPreview } from "@/app/cookiecapes/lib/preview-animation";

export const runtime = "nodejs";
export const maxDuration = 15;

const UUID = /^(?:[a-f0-9]{32}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i;
const HASH = /^[a-f0-9]{32,64}$/i;
const NO_CACHE = { "Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const query = new URL(request.url).searchParams;
  const hash = query.get("skin") ?? undefined;
  const slim = query.get("slim");
  const animated = query.get("animated");
  const capeId = Number(id);
  if (!["capes", "players"].includes(kind)
    || (kind === "capes" ? !/^(0|[1-9]\d{0,15})$/.test(id) || !Number.isSafeInteger(capeId) : !UUID.test(id))
    || [...query.keys()].some(key => !["edited", "skin", "slim", "animated"].includes(key) || query.getAll(key).length !== 1)
    || (animated !== null && animated !== "1")
    || (query.get("edited")?.length ?? 0) > 80
    || (hash !== undefined && (kind !== "players" || !HASH.test(hash)))
    || (slim !== null && (!hash || !["true", "false"].includes(slim)))) {
    return new Response("Invalid preview parameters", { status: 400, headers: NO_CACHE });
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), animated ? 14000 : 8000);
  try {
    const textures = kind === "capes"
      ? { cape: await publicCapeTexture(capeId, controller.signal) }
      : await playerTextures(id.toLowerCase(), controller.signal, hash?.toLowerCase());
    controller.signal.throwIfAborted();
    const animationId = kind === "capes" ? capeId : "capeId" in textures ? textures.capeId : undefined;
    const base = animated && animationId !== undefined ? await publicAnimation(animationId, controller.signal) : undefined;
    const png = base ? await renderAnimationPreview(base, controller.signal, "skin" in textures ? textures.skin : undefined, slim === null ? undefined : slim === "true")
      : await renderPreview({ ...textures, slim: slim === null ? undefined : slim === "true" });
    controller.signal.throwIfAborted();
    return new Response(new Uint8Array(png), {
      headers: {
        ...NO_CACHE,
        "Content-Type": base ? "image/webp" : "image/png",
        "Content-Length": String(png.byteLength),
        ...("cacheable" in textures && !textures.cacheable ? {} : {
          "Cache-Control": "public, max-age=0, must-revalidate",
          "Vercel-CDN-Cache-Control": "public, s-maxage=3600, must-revalidate",
        }),
      },
    });
  } catch (error) {
    const status = controller.signal.aborted ? 504 : error instanceof PreviewError ? ([401, 403].includes(error.status) ? 404 : error.status) : 502;
    return new Response("Preview unavailable", { status, headers: NO_CACHE });
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}
