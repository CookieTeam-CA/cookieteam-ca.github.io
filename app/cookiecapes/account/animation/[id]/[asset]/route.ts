import { accountFetch } from "@/lib/cookieapi-account";
import { CapeApiError } from "@/app/cookiecapes/lib/api";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; asset: string }> }) {
  const { id, asset } = await params;
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (!/^\d+$/.test(id) || !/^(manifest\.json|(?:standard|hd)-\d+\.png)$/.test(asset)) return new Response(null, { status: 400, headers });
  try {
    const response = await accountFetch(`/account/capes/${id}/animation/${asset}`);
    return new Response(response.body, { headers: { ...headers, "Content-Type": asset.endsWith("json") ? "application/json" : "image/png" } });
  } catch (error) { return new Response(null, { status: error instanceof CapeApiError ? error.status || 503 : 401, headers }); }
}
